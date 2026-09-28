/* ==========================================================================
   Souls by Zamani — store settings
   Edit this file to change your contact details, currencies and shipping.
   ========================================================================== */

window.SITE = {
  name: "Souls by Zamani",
  tagline: "Handcrafted for every step",
  email: "hello@soulsbyzamani.com",
  phone: "+234 800 000 0000",
  // WhatsApp number in international format, digits only (no +, no spaces).
  // Orders placed with "Order on WhatsApp" are sent to this number.
  whatsapp: "2348000000000",
  address: "Workshop & Studio, Lagos, Nigeria",
  hours: "Mon – Sat, 9am – 6pm (WAT)",
  social: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
    x: "https://x.com/"
  },

  // All product prices are written in Naira (NGN). Other currencies are
  // converted with these rates — update them as exchange rates change.
  baseCurrency: "NGN",
  currencies: {
    NGN: { symbol: "₦", rate: 1, label: "NGN ₦" },
    USD: { symbol: "$", rate: 1 / 1550, label: "USD $" },
    GBP: { symbol: "£", rate: 1 / 2050, label: "GBP £" },
    EUR: { symbol: "€", rate: 1 / 1750, label: "EUR €" }
  },

  shipping: {
    freeOver: 150000,        // free delivery in Nigeria above this (NGN)
    options: [
      { id: "lagos", label: "Lagos delivery (1–2 days)", price: 3500 },
      { id: "nigeria", label: "Rest of Nigeria (2–5 days)", price: 6000 },
      { id: "express", label: "Express nationwide (next day)", price: 12000 },
      { id: "intl", label: "International DHL (5–10 days)", price: 45000, noFree: true },
      { id: "pickup", label: "Pick up from the workshop", price: 0 }
    ]
  },

  // Card payments. Create a free account at https://paystack.com, then paste
  // your PUBLIC key here (starts with pk_live_ or pk_test_). Leave empty to
  // hide the card option until you are ready.
  paystackPublicKey: "",

  // Shown to customers who choose "Bank transfer".
  bank: {
    bankName: "Your Bank",
    accountName: "Souls by Zamani",
    accountNumber: "0000000000"
  },

  // Online database for the admin backend (see ADMIN.md). Paste your Supabase
  // Project URL and anon public key here. Leave empty for demo mode.
  supabase: {
    url: "",
    anonKey: ""
  },

  // Discount codes customers can use at checkout (percent off).
  // (Once Supabase is connected, codes are managed in the admin instead.)
  promoCodes: {
    WELCOME10: 10,
    SOULS15: 15
  }
};
