/* ==========================================================================
   Souls by Zamani — catalogue
   --------------------------------------------------------------------------
   HOW TO ADD A PRODUCT
   Add a line to the PRODUCTS list below:

   P("men", "shoes", "oxfords", "The Adeyemi Oxford", 85000, ["black","oxblood"],
     { material: "Full-grain calf leather", badges: ["new"], compareAt: 95000,
       images: ["assets/img/adeyemi-1.jpg", "assets/img/adeyemi-2.jpg"] })

   - gender:     "men" or "women"
   - department: "shoes", "bags" or "accessories"
   - category:   a key from CATEGORIES below
   - price:      in Naira
   - colours:    keys from COLOURS below
   - images:     optional. Put your photos in assets/img/ and list them here.
                 Without photos, the site draws a clean illustration instead.
   ========================================================================== */

window.COLOURS = {
  black:     { name: "Black",      hex: "#1b1a19" },
  cognac:    { name: "Cognac",     hex: "#9a5528" },
  tan:       { name: "Tan",        hex: "#c0925f" },
  chocolate: { name: "Chocolate",  hex: "#4a2c1d" },
  oxblood:   { name: "Oxblood",    hex: "#5c1a1f" },
  navy:      { name: "Navy",       hex: "#1f2a44" },
  white:     { name: "White",      hex: "#f3f0ea" },
  cream:     { name: "Cream",      hex: "#e8dcc5" },
  olive:     { name: "Olive",      hex: "#5a5c38" },
  burgundy:  { name: "Burgundy",   hex: "#6b1e2d" },
  nude:      { name: "Nude",       hex: "#d6ae93" },
  red:       { name: "Red",        hex: "#b0262c" },
  blush:     { name: "Blush",      hex: "#e2b3ab" },
  gold:      { name: "Gold",       hex: "#c49a3e" },
  silver:    { name: "Silver",     hex: "#b9b9b9" },
  emerald:   { name: "Emerald",    hex: "#1d5a47" },
  grey:      { name: "Grey",       hex: "#7b7b78" },
  sand:      { name: "Sand",       hex: "#d3bf9b" },
  camel:     { name: "Camel",      hex: "#b3834b" },
  lilac:     { name: "Lilac",      hex: "#b3a0c7" },
  mustard:   { name: "Mustard",    hex: "#c6922a" },
  terracotta:{ name: "Terracotta", hex: "#b45a3c" }
};

/* Categories. `art` picks the illustration used when there is no photo. */
window.CATEGORIES = {
  // ---- Men's shoes ----
  "oxfords":        { label: "Oxfords",           gender: "men",   dept: "shoes", group: "Formal",  art: "oxford" },
  "derbies":        { label: "Derbies",           gender: "men",   dept: "shoes", group: "Formal",  art: "oxford" },
  "brogues":        { label: "Brogues",           gender: "men",   dept: "shoes", group: "Formal",  art: "brogue" },
  "monk-straps":    { label: "Monk Straps",       gender: "men",   dept: "shoes", group: "Formal",  art: "monk" },
  "men-loafers":    { label: "Loafers",           gender: "men",   dept: "shoes", group: "Formal",  art: "loafer" },
  "men-chelsea":    { label: "Chelsea Boots",     gender: "men",   dept: "shoes", group: "Boots",   art: "chelsea" },
  "chukka":         { label: "Chukka & Desert Boots", gender: "men", dept: "shoes", group: "Boots", art: "chukka" },
  "combat":         { label: "Combat & Work Boots", gender: "men", dept: "shoes", group: "Boots",   art: "combat" },
  "men-sneakers":   { label: "Sneakers",          gender: "men",   dept: "shoes", group: "Casual",  art: "sneaker" },
  "boat-shoes":     { label: "Boat Shoes",        gender: "men",   dept: "shoes", group: "Casual",  art: "loafer" },
  "drivers":        { label: "Driving Moccasins", gender: "men",   dept: "shoes", group: "Casual",  art: "driver" },
  "men-espadrilles":{ label: "Espadrilles",       gender: "men",   dept: "shoes", group: "Casual",  art: "espadrille" },
  "men-sandals":    { label: "Sandals",           gender: "men",   dept: "shoes", group: "Sandals & Slides", art: "sandal" },
  "palm-slippers":  { label: "Palm Slippers",     gender: "men",   dept: "shoes", group: "Sandals & Slides", art: "palm" },
  "men-slides":     { label: "Slides",            gender: "men",   dept: "shoes", group: "Sandals & Slides", art: "slide" },
  "men-mules":      { label: "Mules & Babouche",  gender: "men",   dept: "shoes", group: "Sandals & Slides", art: "mule" },
  "men-clogs":      { label: "Clogs & Backless Loafers", gender: "men", dept: "shoes", group: "Sandals & Slides", art: "clog" },
  "fisherman":      { label: "Fisherman Sandals", gender: "men",   dept: "shoes", group: "Sandals & Slides", art: "fisherman" },

  // ---- Women's shoes ----
  "pumps":          { label: "Pumps & Stilettos", gender: "women", dept: "shoes", group: "Heels",   art: "pump" },
  "block-heels":    { label: "Block Heels",       gender: "women", dept: "shoes", group: "Heels",   art: "block" },
  "kitten-heels":   { label: "Kitten Heels",      gender: "women", dept: "shoes", group: "Heels",   art: "kitten" },
  "slingbacks":     { label: "Slingbacks",        gender: "women", dept: "shoes", group: "Heels",   art: "slingback" },
  "heeled-sandals": { label: "Heeled Sandals",    gender: "women", dept: "shoes", group: "Heels",   art: "heelsandal" },
  "wedges":         { label: "Wedges & Platforms",gender: "women", dept: "shoes", group: "Heels",   art: "wedge" },
  "ballet-flats":   { label: "Ballet Flats",      gender: "women", dept: "shoes", group: "Flats",   art: "flat" },
  "mary-janes":     { label: "Mary Janes",        gender: "women", dept: "shoes", group: "Flats",   art: "maryjane" },
  "women-loafers":  { label: "Loafers",           gender: "women", dept: "shoes", group: "Flats",   art: "loafer" },
  "women-mules":    { label: "Mules",             gender: "women", dept: "shoes", group: "Flats",   art: "heelmule" },
  "ankle-boots":    { label: "Ankle Boots",       gender: "women", dept: "shoes", group: "Boots",   art: "ankleboot" },
  "knee-boots":     { label: "Knee-High Boots",   gender: "women", dept: "shoes", group: "Boots",   art: "kneeboot" },
  "women-chelsea":  { label: "Chelsea Boots",     gender: "women", dept: "shoes", group: "Boots",   art: "chelsea" },
  "women-sneakers": { label: "Sneakers",          gender: "women", dept: "shoes", group: "Casual",  art: "sneaker" },
  "women-sandals":  { label: "Flat Sandals",      gender: "women", dept: "shoes", group: "Casual",  art: "sandal" },
  "women-slides":   { label: "Slides",            gender: "women", dept: "shoes", group: "Casual",  art: "slide" },
  "women-clogs":    { label: "Clogs",             gender: "women", dept: "shoes", group: "Casual",  art: "clog" },
  "women-espadrilles": { label: "Espadrilles",    gender: "women", dept: "shoes", group: "Casual",  art: "espadrille" },

  // ---- Women's bags ----
  "totes":          { label: "Tote Bags",         gender: "women", dept: "bags", group: "Bags", art: "tote" },
  "handbags":       { label: "Top-Handle Bags",   gender: "women", dept: "bags", group: "Bags", art: "handbag" },
  "shoulder-bags":  { label: "Shoulder Bags",     gender: "women", dept: "bags", group: "Bags", art: "shoulder" },
  "crossbody":      { label: "Crossbody Bags",    gender: "women", dept: "bags", group: "Bags", art: "crossbody" },
  "clutches":       { label: "Clutches & Evening",gender: "women", dept: "bags", group: "Bags", art: "clutch" },
  "mini-bags":      { label: "Mini Bags",         gender: "women", dept: "bags", group: "Bags", art: "mini" },
  "bucket-bags":    { label: "Bucket Bags",       gender: "women", dept: "bags", group: "Bags", art: "bucket" },
  "backpacks":      { label: "Backpacks",         gender: "women", dept: "bags", group: "Bags", art: "backpack" },

  // ---- Women's accessories ----
  "belts":          { label: "Belts",             gender: "women", dept: "accessories", group: "Accessories", art: "belt" },
  "wallets":        { label: "Wallets & Purses",  gender: "women", dept: "accessories", group: "Accessories", art: "wallet" },
  "card-holders":   { label: "Card Holders",      gender: "women", dept: "accessories", group: "Accessories", art: "cardholder" },
  "key-holders":    { label: "Key Holders & Charms", gender: "women", dept: "accessories", group: "Accessories", art: "charm" },
  "pouches":        { label: "Pouches & Cosmetic Cases", gender: "women", dept: "accessories", group: "Accessories", art: "pouch" },
  "watch-straps":   { label: "Watch Straps",      gender: "women", dept: "accessories", group: "Accessories", art: "strap" }
};

window.SIZES = {
  men:   ["39", "40", "41", "42", "43", "44", "45", "46", "47"],
  women: ["35", "36", "37", "38", "39", "40", "41", "42"]
};

(function () {
  const list = [];
  let n = 0;
  function P(gender, dept, category, name, price, colours, extra) {
    n += 1;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    list.push(Object.assign({
      id: slug,
      sku: "SBZ-" + String(1000 + n),
      name, gender, dept, category, price, colours,
      material: dept === "shoes" ? "Full-grain leather" : "Pebbled calf leather",
      badges: [],
      added: n
    }, extra || {}));
  }

  /* ----------------------------- MEN'S SHOES ----------------------------- */
  P("men","shoes","oxfords","The Adeyemi Oxford", 85000, ["black","oxblood","chocolate"], { badges:["bestseller"], material:"Box calf leather, leather sole" });
  P("men","shoes","oxfords","Wholecut Oxford", 98000, ["black","cognac"], { material:"Single-piece calf leather" });
  P("men","shoes","oxfords","Patent Evening Oxford", 110000, ["black"], { material:"Patent leather, leather sole", badges:["new"] });
  P("men","shoes","derbies","The Kano Derby", 78000, ["chocolate","black","tan"], { badges:["bestseller"] });
  P("men","shoes","derbies","Suede Plain-Toe Derby", 74000, ["sand","navy","chocolate"], { material:"Calf suede, crepe sole" });
  P("men","shoes","brogues","Full Brogue Wingtip", 92000, ["cognac","chocolate","black"], { badges:["handmade"] });
  P("men","shoes","brogues","Semi-Brogue Oxford", 88000, ["tan","oxblood"], { compareAt: 99000 });
  P("men","shoes","brogues","Longwing Blucher", 95000, ["burgundy","chocolate"], {});
  P("men","shoes","monk-straps","Double Monk Strap", 96000, ["chocolate","black","oxblood"], { badges:["bestseller"] });
  P("men","shoes","monk-straps","Single Monk Strap", 89000, ["tan","navy"], { badges:["new"] });
  P("men","shoes","men-loafers","Penny Loafer", 72000, ["chocolate","black","burgundy"], { badges:["bestseller"] });
  P("men","shoes","men-loafers","Tassel Loafer", 76000, ["oxblood","tan"], {});
  P("men","shoes","men-loafers","Horsebit Loafer", 84000, ["black","cognac"], { badges:["new"] });
  P("men","shoes","men-loafers","Velvet Slipper Loafer", 82000, ["navy","emerald","burgundy"], { material:"Cotton velvet, leather lining", compareAt: 90000 });
  P("men","shoes","men-chelsea","Classic Chelsea Boot", 105000, ["black","chocolate","tan"], { badges:["bestseller"] });
  P("men","shoes","men-chelsea","Suede Chelsea Boot", 99000, ["sand","chocolate"], { material:"Calf suede, rubber sole" });
  P("men","shoes","chukka","Suede Desert Boot", 79000, ["sand","chocolate","olive"], { material:"Calf suede, crepe sole" });
  P("men","shoes","chukka","Leather Chukka", 86000, ["cognac","black"], {});
  P("men","shoes","combat","Lace-Up Combat Boot", 115000, ["black","chocolate"], { badges:["new"], material:"Oiled leather, lug sole" });
  P("men","shoes","combat","Heritage Work Boot", 118000, ["tan","cognac"], { material:"Pull-up leather, Goodyear welt" });
  P("men","shoes","men-sneakers","The Lagos Court Sneaker", 68000, ["white","black","cream"], { badges:["bestseller"], material:"Nappa leather, rubber cupsole" });
  P("men","shoes","men-sneakers","Suede Runner", 64000, ["grey","navy","olive"], { material:"Suede and mesh" });
  P("men","shoes","men-sneakers","High-Top Leather Sneaker", 72000, ["white","black"], { badges:["new"] });
  P("men","shoes","boat-shoes","Classic Boat Shoe", 58000, ["tan","navy"], {});
  P("men","shoes","drivers","Driving Moccasin", 62000, ["cognac","navy","sand"], { material:"Soft suede, pebbled rubber sole" });
  P("men","shoes","men-espadrilles","Leather Espadrille", 45000, ["navy","sand","black"], { material:"Leather upper, jute sole" });
  P("men","shoes","men-sandals","Gladiator Sandal", 48000, ["chocolate","black","tan"], {});
  P("men","shoes","men-sandals","Cross-Strap Sandal", 42000, ["cognac","black"], { compareAt: 50000 });
  P("men","shoes","palm-slippers","Aso-Oke Palm Slipper", 35000, ["black","burgundy","emerald"], { badges:["bestseller","handmade"], material:"Leather with woven Aso-Oke strap" });
  P("men","shoes","palm-slippers","Classic Leather Palm", 30000, ["black","chocolate","tan","white"], { badges:["handmade"] });
  P("men","shoes","palm-slippers","Crocodile-Embossed Palm", 42000, ["black","oxblood","navy"], { badges:["new"], material:"Croc-embossed leather" });
  P("men","shoes","palm-slippers","Double-Band Palm", 33000, ["chocolate","black"], {});
  P("men","shoes","men-slides","Everyday Leather Slide", 28000, ["black","tan"], {});
  P("men","shoes","men-mules","Babouche Mule", 52000, ["chocolate","black","olive"], { badges:["new"] });
  P("men","shoes","men-mules","Suede Backless Loafer", 58000, ["sand","navy"], {});

  /* Styles added from the owner's design references */
  P("men","shoes","men-clogs","Heritage Suede Clog", 55000, ["camel","chocolate","olive","cream"], { badges:["new","handmade"], material:"Calf suede, stitched welt, lug sole", art:"clog" });
  P("men","shoes","men-clogs","Buckle-Strap Suede Clog", 58000, ["sand","black","grey"], { badges:["new"], material:"Calf suede, cork footbed", art:"clogstrap" });
  P("men","shoes","men-clogs","Woven Suede Mule", 54000, ["camel","chocolate","black"], { badges:["handmade"], material:"Hand-woven suede strips, cork footbed", art:"clog" });
  P("men","shoes","men-clogs","Backless Penny Loafer", 56000, ["sand","black","chocolate"], { badges:["new"], material:"Suede, chunky crepe sole", art:"clog" });
  P("men","shoes","men-clogs","Suede House Slipper", 38000, ["sand","grey","navy"], { material:"Suede with soft shearling-feel lining", art:"clog" });
  P("men","shoes","fisherman","Perforated Fisherman Sandal", 52000, ["cream","tan","black","chocolate"], { badges:["new","handmade"], material:"Nubuck leather, cork footbed, rubber sole" });
  P("men","shoes","men-slides","Double-Buckle Suede Slide", 42000, ["cognac","black","sand"], { badges:["bestseller","handmade"], material:"Suede straps, cork footbed", art:"doublestrap" });
  P("men","shoes","men-slides","Double-Strap Comfort Slide", 40000, ["cognac","black","olive"], { material:"Suede straps with adjustable tabs, cushioned sole", art:"doublestrap" });
  P("men","shoes","men-slides","Platform Double-Strap Slide", 45000, ["black","chocolate"], { badges:["new"], material:"Nubuck leather, lug platform sole", art:"doublestrap" });
  P("men","shoes","men-slides","Crossover Buckle Slide", 44000, ["black","tan","chocolate"], { badges:["new"], material:"Smooth leather crossover straps", art:"crossslide" });
  P("men","shoes","men-slides","Two-Tone Cross Slide", 40000, ["camel","grey","olive"], { material:"Suede and leather, cushioned footbed", art:"crossslide" });
  P("men","shoes","men-slides","Penny Suede Slide", 36000, ["chocolate","cognac","black"], { badges:["handmade"], material:"Suede with leather penny strap" });
  P("men","shoes","men-slides","Classic Suede Slide", 34000, ["cognac","sand","black","navy"], { material:"Suede upper, leather footbed" });
  P("men","shoes","men-sneakers","Burnished Leather Runner", 78000, ["chocolate","black","cognac"], { badges:["new","handmade"], material:"Hand-burnished calf leather, lightweight sole", art:"runner" });
  P("men","shoes","men-sneakers","Stripe Court Sneaker", 66000, ["white","cream","black"], { material:"Nappa leather, gum rubber cupsole" });

  /* ---------------------------- WOMEN'S SHOES ---------------------------- */
  P("women","shoes","pumps","The Amara Pointed Pump", 78000, ["black","nude","red"], { badges:["bestseller"], material:"Nappa leather, 100mm heel" });
  P("women","shoes","pumps","Patent Stiletto", 84000, ["black","red","nude"], { material:"Patent leather, 110mm heel" });
  P("women","shoes","pumps","Satin Evening Pump", 88000, ["emerald","burgundy","black"], { badges:["new"], material:"Silk satin, 95mm heel" });
  P("women","shoes","pumps","Metallic Pump", 90000, ["gold","silver"], { material:"Metallic leather, 100mm heel", compareAt: 99000 });
  P("women","shoes","block-heels","Square-Toe Block Heel", 72000, ["black","camel","lilac"], { badges:["bestseller"], material:"Calf leather, 70mm heel" });
  P("women","shoes","block-heels","Suede Block Pump", 69000, ["terracotta","black","nude"], { material:"Suede, 60mm heel" });
  P("women","shoes","kitten-heels","Kitten Heel Pump", 65000, ["black","blush","red"], { badges:["new"], material:"Nappa leather, 45mm heel" });
  P("women","shoes","kitten-heels","Pointed Kitten Mule", 62000, ["nude","black"], {});
  P("women","shoes","slingbacks","Signature Slingback", 74000, ["cream","black","blush"], { badges:["bestseller"] });
  P("women","shoes","slingbacks","Two-Tone Slingback", 78000, ["cream","black"], { badges:["new"] });
  P("women","shoes","heeled-sandals","Strappy Heeled Sandal", 70000, ["gold","black","nude"], { material:"Leather straps, 90mm heel" });
  P("women","shoes","heeled-sandals","Block Heel Sandal", 64000, ["tan","black","white"], { compareAt: 72000 });
  P("women","shoes","heeled-sandals","Ankle-Strap Stiletto Sandal", 76000, ["silver","black","red"], {});
  P("women","shoes","wedges","Leather Wedge Sandal", 62000, ["tan","black"], {});
  P("women","shoes","wedges","Espadrille Wedge", 58000, ["sand","black","cream"], { badges:["new"], material:"Leather upper, jute wedge" });
  P("women","shoes","wedges","Platform Pump", 86000, ["black","burgundy"], { material:"Leather, 130mm heel with platform" });
  P("women","shoes","ballet-flats","Classic Ballet Flat", 48000, ["black","nude","red","blush"], { badges:["bestseller"] });
  P("women","shoes","ballet-flats","Pointed Flat", 52000, ["black","camel","emerald"], {});
  P("women","shoes","mary-janes","Mary Jane Flat", 54000, ["black","burgundy"], { badges:["new"] });
  P("women","shoes","mary-janes","Heeled Mary Jane", 66000, ["black","oxblood"], {});
  P("women","shoes","women-loafers","Chunky Lug Loafer", 72000, ["black","chocolate"], { badges:["bestseller"] });
  P("women","shoes","women-loafers","Soft Penny Loafer", 64000, ["tan","burgundy","cream"], {});
  P("women","shoes","women-mules","Heeled Mule", 60000, ["black","nude","lilac"], {});
  P("women","shoes","women-mules","Woven Leather Mule", 58000, ["tan","cream","black"], { badges:["handmade"] });
  P("women","shoes","ankle-boots","Heeled Ankle Boot", 98000, ["black","chocolate","camel"], { badges:["bestseller"] });
  P("women","shoes","ankle-boots","Suede Sock Boot", 94000, ["camel","black"], { material:"Stretch suede" });
  P("women","shoes","knee-boots","Knee-High Riding Boot", 135000, ["black","chocolate","cognac"], { badges:["new"] });
  P("women","shoes","knee-boots","Heeled Knee Boot", 140000, ["black","burgundy"], { compareAt: 155000 });
  P("women","shoes","women-chelsea","Women's Chelsea Boot", 92000, ["black","tan"], {});
  P("women","shoes","women-sneakers","The Lagos Court Sneaker (W)", 64000, ["white","blush","cream"], { badges:["bestseller"], material:"Nappa leather, rubber cupsole" });
  P("women","shoes","women-sneakers","Platform Sneaker", 68000, ["white","black"], { badges:["new"] });
  P("women","shoes","women-sandals","Minimal Flat Sandal", 38000, ["tan","black","gold"], {});
  P("women","shoes","women-sandals","Beaded Ankara Sandal", 42000, ["mustard","emerald","terracotta"], { badges:["handmade"], material:"Leather with hand-beaded strap" });
  P("women","shoes","women-slides","Padded Slide", 40000, ["cream","black","lilac"], { badges:["new"] });
  P("women","shoes","women-slides","Twist Knot Slide", 36000, ["tan","black","terracotta"], {});
  P("women","shoes","women-espadrilles","Lace-Up Espadrille", 44000, ["cream","black"], {});

  P("women","shoes","women-clogs","Soft Suede Clog", 52000, ["blush","camel","cream","olive"], { badges:["new"], material:"Calf suede, cork footbed, lug sole", art:"clog" });
  P("women","shoes","women-clogs","Buckle Clog", 54000, ["sand","black","lilac"], { material:"Suede with metal-plate strap", art:"clogstrap" });
  P("women","shoes","women-slides","Double-Buckle Slide (W)", 40000, ["cognac","cream","black"], { badges:["bestseller"], material:"Suede straps, cork footbed", art:"doublestrap" });
  P("women","shoes","women-sneakers","Stripe Court Sneaker (W)", 62000, ["white","blush","cream"], { material:"Nappa leather, gum rubber cupsole" });

  /* ---------------------------- WOMEN'S BAGS ----------------------------- */
  P("women","bags","totes","The Zamani Tote", 145000, ["cognac","black","cream"], { badges:["bestseller","handmade"], material:"Vegetable-tanned leather" });
  P("women","bags","totes","Soft Shopper Tote", 120000, ["camel","black"], {});
  P("women","bags","totes","Woven Market Tote", 98000, ["tan","sand"], { badges:["handmade"], material:"Hand-woven leather strips" });
  P("women","bags","handbags","Structured Top-Handle Bag", 160000, ["black","burgundy","emerald"], { badges:["new"] });
  P("women","bags","handbags","Lady Frame Bag", 170000, ["black","cream","red"], {});
  P("women","bags","shoulder-bags","Crescent Shoulder Bag", 115000, ["black","chocolate","lilac"], { badges:["bestseller"] });
  P("women","bags","shoulder-bags","Soft Hobo", 110000, ["camel","black"], { compareAt: 125000 });
  P("women","bags","crossbody","Everyday Crossbody", 85000, ["tan","black","terracotta"], { badges:["bestseller"] });
  P("women","bags","crossbody","Camera Crossbody", 78000, ["black","cream","olive"], {});
  P("women","bags","clutches","Envelope Clutch", 65000, ["black","gold","nude"], {});
  P("women","bags","clutches","Satin Evening Clutch", 72000, ["emerald","black","silver"], { badges:["new"], material:"Silk satin, metal frame" });
  P("women","bags","clutches","Ankara-Panel Clutch", 58000, ["mustard","terracotta"], { badges:["handmade"], material:"Leather with Ankara fabric panel" });
  P("women","bags","mini-bags","Micro Top-Handle", 75000, ["blush","black","lilac"], { badges:["new"] });
  P("women","bags","mini-bags","Mini Saddle Bag", 70000, ["cognac","cream"], {});
  P("women","bags","bucket-bags","Drawstring Bucket Bag", 105000, ["tan","black","chocolate"], {});
  P("women","bags","backpacks","Leather City Backpack", 135000, ["black","cognac"], {});

  /* ------------------------ WOMEN'S ACCESSORIES -------------------------- */
  P("women","accessories","belts","Classic Leather Belt", 28000, ["black","tan","chocolate"], { badges:["bestseller"], material:"Calf leather, brass buckle" });
  P("women","accessories","belts","Waist Belt", 32000, ["black","camel","red"], {});
  P("women","accessories","wallets","Zip-Around Wallet", 38000, ["black","burgundy","cream"], {});
  P("women","accessories","wallets","Bifold Purse", 34000, ["tan","blush","black"], { badges:["new"] });
  P("women","accessories","card-holders","Slim Card Holder", 18000, ["black","tan","emerald","lilac"], { badges:["bestseller"] });
  P("women","accessories","card-holders","Card Case with Zip", 22000, ["cream","black"], {});
  P("women","accessories","key-holders","Tassel Bag Charm", 15000, ["cognac","black","red"], { badges:["handmade"] });
  P("women","accessories","key-holders","Leather Key Ring", 12000, ["tan","black","terracotta"], {});
  P("women","accessories","pouches","Cosmetic Pouch", 26000, ["cream","black","blush"], {});
  P("women","accessories","pouches","Leather Laptop Sleeve", 48000, ["tan","black"], { badges:["new"] });
  P("women","accessories","watch-straps","Leather Watch Strap", 16000, ["black","tan","burgundy","navy"], {});

  window.PRODUCTS = list;
})();

/* ==========================================================================
   Workshop gallery (the cascading photo wall on the Home and Bespoke pages)
   --------------------------------------------------------------------------
   Put photos in assets/img/gallery/ and set `src` to the file path.
   `shape` controls the tile height in the cascade: "tall", "square" or "wide".
   If a photo is missing, the tile shows an illustration instead (`art`).
   For stock photos, fill in `credit` and `creditUrl` (Unsplash/Pexels ask
   for a credit line; it appears when the photo is opened).
   ========================================================================== */
window.GALLERY = [
  { src: "", shape: "tall",   art: "brogue:cognac",    caption: "Full brogue, hand-punched and burnished", credit: "", creditUrl: "" },
  { src: "", shape: "square", art: "oxford:black",     caption: "Wholecut oxford on the last", credit: "", creditUrl: "" },
  { src: "", shape: "wide",   art: "chelsea:chocolate",caption: "Chelsea boots waiting for their soles", credit: "", creditUrl: "" },
  { src: "", shape: "square", art: "pump:red",         caption: "Bespoke bridal pump, made to measure", credit: "", creditUrl: "" },
  { src: "", shape: "tall",   art: "palm:burgundy",    caption: "Aso-Oke palm slippers for a groom's party", credit: "", creditUrl: "" },
  { src: "", shape: "wide",   art: "loafer:oxblood",   caption: "Penny loafers, hand-stitched apron", credit: "", creditUrl: "" },
  { src: "", shape: "wide",   art: "monk:tan",         caption: "Double monk straps with brass buckles", credit: "", creditUrl: "" },
  { src: "", shape: "square", art: "tote:cognac",      caption: "Vegetable-tanned tote, edges painted by hand", credit: "", creditUrl: "" },
  { src: "", shape: "tall",   art: "combat:black",     caption: "Welted work boots, built to be resoled", credit: "", creditUrl: "" }
];
