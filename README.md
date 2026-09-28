# Souls by Zamani

The online store for **Souls by Zamani**: handmade shoes for men and women, plus bags and leather accessories for women.

It is a plain HTML, CSS and JavaScript website with no build step and no server needed, so it can be hosted for free.

## What's included

| Page | File |
|---|---|
| Home (hero, departments, shop by style, new in / bestsellers / sale, story, process) | `index.html` |
| Shop with filters (department, category, size, colour, price, highlights) and sorting | `shop.html` |
| Product page (colour gallery, sizes, size guide, WhatsApp enquiry, related items) | `product.html` |
| Bag and checkout (delivery options, discount codes, 4 payment methods) | `cart.html`, `checkout.html` |
| Wishlist, Our Story, Bespoke orders, Contact, Help (delivery, returns, size guide, care, FAQs), 404 | other `.html` files |

**Catalogue:** 117 products across 50 categories.
- **Men's shoes:** oxfords, derbies, brogues, monk straps, loafers, Chelsea, chukka and combat boots, sneakers, boat shoes, drivers, espadrilles, sandals, fisherman sandals, palm slippers, slides, mules, clogs and backless loafers.
- **Women's shoes:** pumps, block heels, kitten heels, slingbacks, heeled sandals, wedges, ballet flats, Mary Janes, loafers, mules, ankle, knee-high and Chelsea boots, sneakers, sandals, slides, clogs and espadrilles.
- **Women's bags:** totes, top-handle, shoulder, crossbody, clutches, mini, bucket bags and backpacks.
- **Women's accessories:** belts, wallets, card holders, key holders and charms, pouches and watch straps.

## Admin backend

Manage products, categories, orders, customers, payments, discount codes, staff and roles at **`/admin/`**. It works in demo mode straight away. See **[ADMIN.md](ADMIN.md)** to connect the free Supabase database and go live.

## Brand

| Colour | Hex | Use |
|---|---|---|
| Espresso | `#1E1611` | Text, dark sections |
| Cognac | `#8B4A22` | Brand accent, logo |
| Brass | `#B8913F` | Highlights |
| Ivory | `#FBF8F3` | Background |

The logo is a shoe sole with hand-stitching and a serif **S**. You'll find it in `assets/img/`:
- `logo.svg`: for light backgrounds
- `logo-light.svg`: for dark backgrounds
- `logo-mark.svg`: the emblem on its own, for social media or packaging
- `favicon.svg`: the browser-tab icon

## Your first edits

1. **Contact details, WhatsApp number, bank account and delivery prices:** edit `assets/js/config.js`.
2. **Products and prices:** edit `assets/js/data.js`. Instructions are at the top of that file.
3. **Product photos:** put your photos in `assets/img/` and add `images: ["assets/img/your-photo.jpg"]` to the product. Until then, the site shows a drawing of each style in the chosen leather colour.
4. **Card payments:** create a free [Paystack](https://paystack.com) account and paste your public key into `paystackPublicKey` in `config.js`. The "Card, bank or USSD" option then appears at checkout.

## Put it online (free)

**GitHub Pages:** in the repository, go to Settings → Pages, choose "Deploy from a branch", pick your branch and the `/ (root)` folder, then save. The site goes live at `https://<username>.github.io/Souls/`.

**Netlify:** drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

## Preview on your computer

Open `index.html` in your browser, or run `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Good to know

- The bag, wishlist and orders are saved in each shopper's own browser. Orders reach you through WhatsApp, bank-transfer receipts or Paystack. There is no admin dashboard yet.
- There are no star ratings or reviews on the site yet. Add real ones as customers send them in.
