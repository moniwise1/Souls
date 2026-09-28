# Souls by Zamani: admin backend

Your admin is at **`/admin/`** on your website, e.g. **https://moniwise1.github.io/Souls/admin/**.

## What it does

| Screen | What you can do |
|---|---|
| **Dashboard** | Sales and paid revenue for the last 30 days, average order, orders awaiting payment, new customers, a daily sales chart, orders by status, best sellers |
| **Orders** | Search and filter orders. Open one to see its items, customer and address. Change its status (new → confirmed → in production → ready → shipped → delivered). Add private staff notes, record a payment, WhatsApp the customer, print an invoice, export to CSV |
| **Payments** | Every payment with its method and reference, total received, what's still owed, export to CSV |
| **Customers** | Customer list with orders and total spent. Add or edit customers, add tags (e.g. VIP), notes and marketing consent. Import and export CSV |
| **Discount codes** | Create codes with a % off, an expiry date and a usage limit |
| **Products** | Add, edit, duplicate, archive or delete products. Choose a category, set the price and sale price, pick colours and sizes, and upload photos for each colour (drag and drop). Add labels (new, bestseller, artisan special), set stock, and import/export CSV |
| **Categories** | Add or rename categories for men's shoes, women's shoes, bags and accessories, and choose the drawing shown when a product has no photo |
| **Staff & roles** | Approve new staff, give each person a role, remove access, create your own roles, and tick exactly what each role can do |
| **Store settings** | Store name, phone, email, WhatsApp, address, opening hours, Paystack key, bank details, delivery prices, free-delivery threshold |
| **Activity log** | Who changed what, and when |

### Built-in roles

| Role | Can do |
|---|---|
| Owner | Everything. There is only one owner, and they can't be removed |
| Administrator | Everything except changing the owner |
| Store manager | Products, categories, orders, customers, discounts; can view payments |
| Catalogue editor | Products, photos and categories only |
| Customer support | Orders and customers |
| Accountant | Views orders and customers; views and records payments |
| Viewer | Read-only |

You can change any of these (except Owner) or create new roles under **Staff & roles**.

## Demo mode (works right now)

Until a database is connected, the admin runs in **demo mode**:

- Open `/admin/`, pick a role and click **Enter admin**.
- Everything you change is saved **in that browser only**, and the shop on the same device shows your changes. That makes it good for practising, but your staff and customers won't see them.
- Use **Switch role** to see what each team member would see, and **Reset demo data** to start again.

## Going live (about 15 minutes, free)

The live admin uses **Supabase**, a hosted PostgreSQL database with logins and file storage. The free plan is enough to start.

1. **Create the database.** Sign up at https://supabase.com, then click **New project**. Name it `souls-by-zamani`, choose a strong database password and pick the region closest to Nigeria (e.g. *West EU* or *Cape Town*).
2. **Create the tables.** In your project, open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. **Load your catalogue.** Open another new query, paste [`supabase/seed.sql`](supabase/seed.sql) and click **Run**. This adds all your categories, products and photos.
4. **Connect the website.** In Supabase, go to **Project Settings → API** and copy the **Project URL** and the **anon public** key. Paste them into `assets/js/config.js`:
   ```js
   supabase: {
     url: "https://xxxx.supabase.co",
     anonKey: "eyJhbGciOi..."
   },
   ```
   The anon key is safe to publish: the database's security rules decide what it can do. **Never** put the `service_role` key in the website.
5. **Set up sign-in links.** In Supabase, go to **Authentication → URL Configuration** and set the **Site URL** to your admin address, e.g. `https://moniwise1.github.io/Souls/admin/`.
6. **Become the owner.** Open `/admin/`, click **Create an account**, confirm your email and sign in. Then click **"I'm the owner: claim this store"**. Only the first person can do this.
7. **Add your team.** Send staff the admin link. They create an account and click **Request access**. You then approve them under **Staff & roles** and choose their role.

From then on, orders placed on the website appear in the admin. Products, prices, photos and settings you change in the admin show on the website straight away.

### Card payments (Paystack)

1. Create an account at https://paystack.com and get your **public key** (`pk_live_…`).
2. In the admin, go to **Store settings → Paystack public key**, paste it and save. Customers will then see "Card, bank or USSD" at checkout.
3. *(Recommended)* To mark card orders as paid automatically, deploy the webhook in [`supabase/functions/paystack-webhook`](supabase/functions/paystack-webhook/index.ts) with the Supabase CLI:
   ```
   supabase functions deploy paystack-webhook --no-verify-jwt
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
   ```
   Then in Paystack, go to **Settings → API Keys & Webhooks** and set the webhook URL to `https://<your-project>.supabase.co/functions/v1/paystack-webhook`.
   Without the webhook, card orders show as **pending**. Check your Paystack dashboard and record the payment from the order screen.

## How your data is protected

- Every table has **Row Level Security**. Shoppers can only read live products and place orders. They can't read other customers or orders.
- Orders are **re-priced on the server** (`place_order`), so nobody can change a price or total in their browser.
- Staff can only do what their role allows. This is enforced by the database, not just by hiding buttons.
- The owner can't be demoted or removed by anyone else, and nobody can promote themselves.
- Every admin change is written to the **activity log**.

## Files

| File | Purpose |
|---|---|
| `admin/index.html`, `admin/admin.js`, `admin/admin.css` | The admin app |
| `assets/js/backend.js` | Data layer shared by the shop and the admin (live or demo) |
| `supabase/schema.sql` | Database tables, roles, permissions and security rules |
| `supabase/seed.sql` | Your starting catalogue (rebuild with `node tools/make-seed.js`) |
| `supabase/functions/paystack-webhook/` | Confirms Paystack payments automatically |
