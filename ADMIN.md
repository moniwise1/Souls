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
| **Team & roles** | Invite team members by email with a job title and role, change roles, suspend or remove access, resend invitations, create your own roles, and tick exactly what each role can do |
| **My account** | Change your name and password, and turn on two-step verification |
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

You can change any of these (except Owner) or create new roles under **Team & roles**.

## Signing in

- **Everyone signs in with their email address and password** at `/admin/`.
- **Forgot password?** sends a secure reset link by email.
- **Two-step verification** (recommended for the owner and admins): go to **My account → Turn on two-step verification** and scan the QR code with Google Authenticator, Microsoft Authenticator or similar.
- **New team members join by invitation only.** Go to **Team & roles → Invite team member**, then enter their name, email and job title and choose a role. They get an email, click the link, choose their own password, and can only see and do what their role allows. You can change a member's role, suspend their access, resend an invitation or remove them at any time. Every change is recorded in the activity log.

Until the database is connected, the sign-in page explains that sign-in isn't switched on yet. It also offers **Preview the admin with sample data**, where changes stay in that browser only.

## Going live (about 20 minutes, free)

The live admin uses **Supabase**, a hosted PostgreSQL database with secure logins, email invitations and file storage. The free plan is enough to start.

1. **Create the database.** Sign up at https://supabase.com, then click **New project**. Name it `souls-by-zamani`, choose a strong database password and pick the region closest to Nigeria (e.g. *West EU* or *Cape Town*).
2. **Create the tables.** Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. **Load your catalogue.** Open another new query, paste [`supabase/seed.sql`](supabase/seed.sql) and click **Run**.
4. **Connect the website.** Go to **Project Settings → API** and copy the **Project URL** and the **Publishable key** (or the legacy **anon** key) into `assets/js/config.js`:
   ```js
   supabase: {
     url: "https://xxxx.supabase.co",
     anonKey: "sb_publishable_..."
   },
   ```
   The publishable key is safe to publish, because the database's security rules decide what it can do. **Never** put a secret or `service_role` key in the website.
5. **Set the sign-in links.** Go to **Authentication → URL Configuration**. Set **Site URL** to `https://moniwise1.github.io/Souls/admin/` and add the same address under **Redirect URLs**.
6. **Turn on invitations.** Go to **Edge Functions → Deploy a new function → Via editor**. Name it `invite-staff`, paste [`supabase/functions/invite-staff/index.ts`](supabase/functions/invite-staff/index.ts) and click **Deploy**.
7. **Create your owner account.** Open `/admin/`, click **First time? Set up the owner account**, and enter your name, email and a strong password. This link disappears once the store has an owner.
8. **Lock sign-ups.** Go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**. From now on, only people you invite can get in.
9. *(Recommended)* **Use your own email sender.** Supabase's built-in email sends only a few messages per hour. For reliable invitations and password resets, add an email service (e.g. Resend, Brevo or Zoho) under **Authentication → Emails → SMTP Settings**. You can also customise the invitation email text there.

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
| `supabase/functions/invite-staff/` | Sends team invitations and removes members |
| `supabase/functions/paystack-webhook/` | Confirms Paystack payments automatically |
