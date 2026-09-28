-- ==========================================================================
-- Souls by Zamani — database schema (Supabase / PostgreSQL)
-- --------------------------------------------------------------------------
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query
-- → paste this whole file → Run. It is safe to run again (idempotent).
--
-- What it creates
--   • Catalogue:  categories, products
--   • Sales:      customers, orders, payments, promo_codes
--   • Team:       roles (with permissions), staff (admin users)
--   • Other:      settings, audit_log, product-images storage bucket
--   • Security:   Row Level Security on every table. Shoppers can only read
--                 the live catalogue and place orders through place_order(),
--                 which re-prices everything on the server. Staff can only do
--                 what their role allows.
-- ==========================================================================

-- ---------------------------------------------------------------- roles ----
create table if not exists public.roles (
  key         text primary key,
  label       text not null,
  description text default '',
  permissions text[] not null default '{}',
  locked      boolean not null default false,       -- built-in roles can't be deleted
  created_at  timestamptz not null default now()
);

insert into public.roles (key, label, description, permissions, locked) values
 ('owner',      'Owner',      'Full control, including staff, roles and settings. Cannot be removed.',
   array['*'], true),
 ('admin',      'Administrator', 'Everything except changing the owner.',
   array['dashboard','orders.view','orders.manage','products.view','products.manage','categories.manage','customers.view','customers.manage','payments.view','payments.manage','promos.manage','staff.manage','settings.manage','audit.view'], true),
 ('manager',    'Store manager', 'Runs the shop day to day: products, orders, customers and discounts.',
   array['dashboard','orders.view','orders.manage','products.view','products.manage','categories.manage','customers.view','customers.manage','payments.view','promos.manage','audit.view'], true),
 ('editor',     'Catalogue editor', 'Adds and edits products, photos and categories.',
   array['dashboard','products.view','products.manage','categories.manage'], true),
 ('support',    'Customer support', 'Handles orders and customers.',
   array['dashboard','orders.view','orders.manage','customers.view','customers.manage'], true),
 ('accountant', 'Accountant', 'Sees orders and payments, records payments.',
   array['dashboard','orders.view','payments.view','payments.manage','customers.view','audit.view'], true),
 ('viewer',     'Viewer', 'Read-only access to everything except staff.',
   array['dashboard','orders.view','products.view','customers.view','payments.view'], true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------- staff ----
create table if not exists public.staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text default '',
  role       text references public.roles(key) on update cascade,
  active     boolean not null default false,          -- pending until approved
  created_at timestamptz not null default now(),
  last_seen  timestamptz
);

alter table public.staff add column if not exists title text default '';        -- job title, e.g. Shoemaker
alter table public.staff add column if not exists invited_at timestamptz;
alter table public.staff add column if not exists invited_by uuid;

-- Helpers used by the security policies ----------------------------------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid() and active
$$;

create or replace function public.has_perm(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff s join public.roles r on r.key = s.role
    where s.user_id = auth.uid() and s.active
      and ('*' = any(r.permissions) or perm = any(r.permissions))
  )
$$;

-- The first person to sign in becomes the owner (only while nobody is).
create or replace function public.claim_owner() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.staff where role = 'owner') then
    raise exception 'This store already has an owner';
  end if;
  insert into public.staff (user_id, email, role, active)
  values (auth.uid(), coalesce(auth.jwt()->>'email', ''), 'owner', true)
  on conflict (user_id) do update set role = 'owner', active = true;
end $$;

-- Lets the sign-in page offer first-time owner setup only while there is none.
create or replace function public.store_has_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where role = 'owner' and active)
$$;
grant execute on function public.store_has_owner() to anon, authenticated;

-- Team members can edit their own name and record when they were last active,
-- without being able to change their own role or access.
create or replace function public.update_my_profile(p_name text) returns void
language sql security definer set search_path = public as $$
  update public.staff set name = coalesce(p_name, name) where user_id = auth.uid()
$$;
create or replace function public.touch_me() returns void
language sql security definer set search_path = public as $$
  update public.staff set last_seen = now() where user_id = auth.uid()
$$;

-- Anyone signed in can ask for access; an admin then approves and picks a role.
create or replace function public.request_access(display_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.staff (user_id, email, name, active)
  values (auth.uid(), coalesce(auth.jwt()->>'email', ''), coalesce(display_name, ''), false)
  on conflict (user_id) do nothing;
end $$;

-- ----------------------------------------------------------- catalogue ----
create table if not exists public.categories (
  key        text primary key,                        -- e.g. 'oxfords'
  label      text not null,
  gender     text not null check (gender in ('men','women')),
  dept       text not null check (dept in ('shoes','bags','accessories')),
  grp        text not null default '',                -- menu group, e.g. 'Formal'
  art        text not null default 'oxford',          -- illustration fallback
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,                       -- URL slug
  sku         text unique,
  name        text not null,
  category    text not null references public.categories(key) on update cascade,
  gender      text not null check (gender in ('men','women')),
  dept        text not null check (dept in ('shoes','bags','accessories')),
  price       integer not null check (price >= 0),    -- Naira
  compare_at  integer check (compare_at is null or compare_at >= 0),
  colours     text[] not null default '{}',
  sizes       text[] not null default '{}',
  material    text default '',
  description text default '',
  badges      text[] not null default '{}',           -- new, bestseller, handmade
  gallery     jsonb not null default '{}'::jsonb,     -- {"cognac": ["url1","url2"]}
  stock       integer not null default 0,
  made_to_order boolean not null default true,
  art         text,                                   -- illustration used when there is no photo
  status      text not null default 'active' check (status in ('active','draft','archived')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category);

-- ---------------------------------------------------------------- sales ----
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique,
  phone      text default '',
  first_name text default '',
  last_name  text default '',
  address    text default '',
  city       text default '',
  state      text default '',
  country    text default 'Nigeria',
  notes      text default '',
  tags       text[] not null default '{}',
  marketing  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code        text primary key,
  percent_off integer not null check (percent_off between 1 and 90),
  active      boolean not null default true,
  expires_at  timestamptz,
  max_uses    integer,
  uses        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id              text primary key,                  -- e.g. SBZ7K2Q9
  customer_id     uuid references public.customers(id) on delete set null,
  items           jsonb not null,                    -- [{id,name,colour,size,qty,price}]
  subtotal        integer not null,
  discount        integer not null default 0,
  promo_code      text,
  shipping_method text not null,
  shipping_cost   integer not null default 0,
  total           integer not null,
  currency        text not null default 'NGN',
  payment_method  text not null check (payment_method in ('card','transfer','pod','whatsapp')),
  payment_status  text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded','failed')),
  status          text not null default 'new' check (status in ('new','confirmed','in_production','ready','shipped','delivered','cancelled','returned')),
  address         jsonb not null default '{}'::jsonb,
  notes           text default '',
  internal_notes  text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  order_id   text references public.orders(id) on delete set null,
  provider   text not null,                           -- paystack, transfer, cash
  reference  text,
  amount     integer not null,
  status     text not null default 'success' check (status in ('success','pending','failed','refunded')),
  verified   boolean not null default false,          -- true when confirmed by Paystack webhook
  recorded_by uuid references auth.users(id),
  raw        jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------- settings -----
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

create table if not exists public.audit_log (
  id         bigserial primary key,
  actor      uuid,
  actor_email text,
  action     text not null,
  entity     text,
  entity_id  text,
  details    jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_action(p_action text, p_entity text, p_entity_id text, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', p_action, p_entity, p_entity_id, p_details)
$$;

-- ----------------------------------------------- checkout (server-priced) --
-- The website calls this to place an order. Prices, discounts and delivery
-- are recalculated here from the database, so they can't be tampered with.
create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_items jsonb := '[]'::jsonb; v_sub integer := 0; v_disc integer := 0; v_ship integer := 0;
  v_pct integer := 0; v_free integer; v_opt jsonb; v_cust uuid; v_id text; it jsonb; p record;
  c jsonb := payload->'customer';
begin
  for it in select * from jsonb_array_elements(payload->'items') loop
    select * into p from public.products where id = it->>'id' and status = 'active';
    if not found then raise exception 'Product % is not available', it->>'id'; end if;
    if (it->>'qty')::int < 1 or (it->>'qty')::int > 10 then raise exception 'Invalid quantity'; end if;
    v_sub := v_sub + p.price * (it->>'qty')::int;
    v_items := v_items || jsonb_build_object('id', p.id, 'name', p.name, 'colour', it->>'colour',
               'size', it->>'size', 'qty', (it->>'qty')::int, 'price', p.price);
  end loop;
  if jsonb_array_length(v_items) = 0 then raise exception 'Your bag is empty'; end if;

  if coalesce(payload->>'promo','') <> '' then
    select percent_off into v_pct from public.promo_codes
    where code = upper(payload->>'promo') and active
      and (expires_at is null or expires_at > now()) and (max_uses is null or uses < max_uses);
    if found then
      v_disc := round(v_sub * v_pct / 100.0);
      update public.promo_codes set uses = uses + 1 where code = upper(payload->>'promo');
    end if;
  end if;

  select value->'options' into v_opt from public.settings where key = 'shipping';
  select (value->>'freeOver')::int into v_free from public.settings where key = 'shipping';
  select coalesce((o->>'price')::int, 0) into v_ship
  from jsonb_array_elements(coalesce(v_opt, '[]'::jsonb)) o where o->>'id' = payload->>'ship' limit 1;
  if v_free is not null and v_sub - v_disc >= v_free and payload->>'ship' <> 'intl' then v_ship := 0; end if;

  insert into public.customers (email, phone, first_name, last_name, address, city, state, country)
  values (lower(c->>'email'), c->>'phone', c->>'first', c->>'last', c->>'address', c->>'city', c->>'state', coalesce(c->>'country','Nigeria'))
  on conflict (email) do update set phone = excluded.phone, first_name = excluded.first_name,
    last_name = excluded.last_name, address = excluded.address, city = excluded.city,
    state = excluded.state, country = excluded.country
  returning id into v_cust;

  v_id := 'SBZ' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7));
  insert into public.orders (id, customer_id, items, subtotal, discount, promo_code, shipping_method,
    shipping_cost, total, payment_method, payment_status, address, notes)
  values (v_id, v_cust, v_items, v_sub, v_disc, nullif(upper(payload->>'promo'),''), coalesce(payload->>'shipLabel', payload->>'ship'),
    v_ship, v_sub - v_disc + v_ship, payload->>'pay',
    case when payload->>'pay' = 'card' then 'pending' else 'unpaid' end,
    c - 'email', coalesce(c->>'notes',''));
  return jsonb_build_object('id', v_id, 'subtotal', v_sub, 'discount', v_disc, 'shipping', v_ship, 'total', v_sub - v_disc + v_ship, 'items', v_items);
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Lets the checkout show a discount without exposing the list of codes.
create or replace function public.check_promo(p_code text) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select percent_off from public.promo_codes
    where code = upper(p_code) and active and (expires_at is null or expires_at > now())
      and (max_uses is null or uses < max_uses)), 0)
$$;
grant execute on function public.check_promo(text) to anon, authenticated;

-- ------------------------------------------------------ updated_at stamps --
create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch();

-- ------------------------------------------------------------ security ----
alter table public.products add column if not exists art text;
alter table public.roles       enable row level security;
alter table public.staff       enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders      enable row level security;
alter table public.payments    enable row level security;
alter table public.settings    enable row level security;
alter table public.audit_log   enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Public storefront
create policy "public reads categories" on public.categories for select using (true);
create policy "public reads live products" on public.products for select using (status = 'active' or public.has_perm('products.view'));
create policy "public reads store settings" on public.settings for select using (key in ('store','shipping','bank','currencies'));

-- Staff
create policy "staff read roles"   on public.roles for select using (auth.uid() is not null);
create policy "manage roles"       on public.roles for all using (public.has_perm('staff.manage')) with check (public.has_perm('staff.manage'));
create policy "see own staff row"  on public.staff for select using (user_id = auth.uid() or public.has_perm('staff.manage'));
create policy "manage staff"       on public.staff for update
  using (public.has_perm('staff.manage') and (role is distinct from 'owner' or public.my_role() = 'owner'))
  with check (public.has_perm('staff.manage') and (role is distinct from 'owner' or public.my_role() = 'owner'));
create policy "remove staff"       on public.staff for delete using (public.has_perm('staff.manage') and role is distinct from 'owner');

create policy "manage categories" on public.categories for all using (public.has_perm('categories.manage')) with check (public.has_perm('categories.manage'));
create policy "manage products"   on public.products   for all using (public.has_perm('products.manage')) with check (public.has_perm('products.manage'));

create policy "view customers"   on public.customers for select using (public.has_perm('customers.view'));
create policy "manage customers" on public.customers for all using (public.has_perm('customers.manage')) with check (public.has_perm('customers.manage'));

create policy "view orders"   on public.orders for select using (public.has_perm('orders.view'));
create policy "manage orders" on public.orders for update using (public.has_perm('orders.manage') or public.has_perm('payments.manage'))
  with check (public.has_perm('orders.manage') or public.has_perm('payments.manage'));

create policy "view payments"   on public.payments for select using (public.has_perm('payments.view'));
create policy "record payments" on public.payments for insert with check (public.has_perm('payments.manage') or public.has_perm('orders.manage'));
create policy "edit payments"   on public.payments for update using (public.has_perm('payments.manage'));

create policy "view promos"   on public.promo_codes for select using (public.has_perm('promos.manage'));
create policy "manage promos" on public.promo_codes for all using (public.has_perm('promos.manage')) with check (public.has_perm('promos.manage'));

create policy "manage settings" on public.settings for all using (public.has_perm('settings.manage')) with check (public.has_perm('settings.manage'));
create policy "view audit"      on public.audit_log for select using (public.has_perm('audit.view'));

-- --------------------------------------------------------- image storage --
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;
drop policy if exists "public product images" on storage.objects;
drop policy if exists "staff upload product images" on storage.objects;
drop policy if exists "staff change product images" on storage.objects;
drop policy if exists "staff delete product images" on storage.objects;
create policy "public product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "staff upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and public.has_perm('products.manage'));
create policy "staff change product images" on storage.objects for update using (bucket_id = 'product-images' and public.has_perm('products.manage'));
create policy "staff delete product images" on storage.objects for delete using (bucket_id = 'product-images' and public.has_perm('products.manage'));

-- ------------------------------------------------------ default settings --
insert into public.settings (key, value) values
 ('shipping', '{"freeOver":150000,"options":[{"id":"lagos","label":"Lagos delivery (1–2 days)","price":3500},{"id":"nigeria","label":"Rest of Nigeria (2–5 days)","price":6000},{"id":"express","label":"Express nationwide (next day)","price":12000},{"id":"intl","label":"International DHL (5–10 days)","price":45000,"noFree":true},{"id":"pickup","label":"Pick up from the workshop","price":0}]}'),
 ('promo_defaults', '{}')
on conflict (key) do nothing;
insert into public.promo_codes (code, percent_off) values ('WELCOME10', 10), ('SOULS15', 15) on conflict do nothing;

-- --------------------------------------------------- function permissions --
-- Functions that need a signed-in user aren't callable anonymously.
-- (has_perm and my_role stay public: the storefront's read policies use them.)
alter function public.touch() set search_path = public;
revoke execute on function public.claim_owner() from public, anon;
revoke execute on function public.log_action(text, text, text, jsonb) from public, anon;
revoke execute on function public.request_access(text) from public, anon;
revoke execute on function public.touch_me() from public, anon;
revoke execute on function public.update_my_profile(text) from public, anon;
grant execute on function public.claim_owner() to authenticated;
grant execute on function public.log_action(text, text, text, jsonb) to authenticated;
grant execute on function public.request_access(text) to authenticated;
grant execute on function public.touch_me() to authenticated;
grant execute on function public.update_my_profile(text) to authenticated;

-- -------------------------------------------------------- invite-only ------
-- Once the store has an owner, new accounts can only be created through an
-- invitation from the admin (the invite-staff function allow-lists the email
-- in pending_invites first). This works even if "Allow new users to sign up"
-- is left on in the Supabase dashboard.
create table if not exists public.pending_invites (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.pending_invites enable row level security;  -- no policies: service role only

create or replace function public.block_public_signups() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.invited_at is null
     and not exists (select 1 from public.pending_invites where email = lower(new.email))
     and exists (select 1 from public.staff where role = 'owner' and active) then
    raise exception 'Sign-ups are closed. Ask the store owner for an invitation.';
  end if;
  return new;
end $$;
revoke execute on function public.block_public_signups() from public, anon, authenticated;
drop trigger if exists invite_only on auth.users;
create trigger invite_only before insert on auth.users
  for each row execute function public.block_public_signups();
