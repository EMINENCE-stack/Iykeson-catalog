/* Shared code: loads the Google Sheet, cleans it, and builds links. */
(function () {
  const CFG = window.IYKESON_CONFIG;
  const CACHE_KEY = "iykeson_catalog_cache_v1";

  /* ---------- CSV parser (handles quotes, commas, new lines inside cells) ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); cell = ""; rows.push(row); row = [];
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ""));
  }

  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const pick = (obj, names) => { for (const n of names) if (obj[n] !== undefined && obj[n] !== "") return obj[n]; return ""; };

  const KNOWN = {
    code: ["productcode", "code", "sku", "itemcode", "id", "productid"],
    name: ["name", "productname", "item", "itemname", "title", "product"],
    category: ["category", "categories", "type", "producttype", "group"],
    price: ["price", "unitprice", "amount", "cost", "pricen", "pricengn"],
    description: ["description", "details", "about", "notes", "info"],
    status: ["status", "availability", "available", "stock", "instock"],
    featured: ["featured", "feature", "highlight", "bestseller", "popular"]
  };

  function toProducts(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    const keys = headers.map(norm);
    const used = new Set(Object.values(KNOWN).flat());
    const isImg = k => /^(image|img|photo|picture|pic)/.test(k);
    const isVid = k => /^video/.test(k);
    const products = [];

    rows.slice(1).forEach((r, idx) => {
      const o = {}, raw = {};
      keys.forEach((k, i) => { if (k) { o[k] = (r[i] || "").trim(); raw[k] = headers[i]; } });

      const name = pick(o, KNOWN.name);
      if (!name) return;
      const status = pick(o, KNOWN.status).toLowerCase();
      if (/^(hidden|draft|archive|archived|delete|deleted|hide)/.test(status)) return;

      const images = [], videos = [];
      keys.forEach((k, i) => {
        const v = (r[i] || "").trim();
        if (!v) return;
        if (isImg(k) && /^https?:/i.test(v)) images.push(v);
        else if (isVid(k) && /^https?:/i.test(v)) videos.push(v);
      });

      const specs = [];
      keys.forEach((k, i) => {
        const v = (r[i] || "").trim();
        if (!k || !v || used.has(k) || isImg(k) || isVid(k)) return;
        specs.push([headers[i], v]);
      });

      const code = pick(o, KNOWN.code) || ("ITEM" + (idx + 1));
      products.push({
        code, name,
        category: pick(o, KNOWN.category) || "Other",
        price: pick(o, KNOWN.price),
        description: pick(o, KNOWN.description),
        out: /(out|sold|unavail|^no$|^0$|finished)/.test(status),
        featured: /^(yes|y|true|1|x|featured|✓)/i.test(pick(o, KNOWN.featured)),
        images, videos, specs, order: idx
      });
    });
    return products;
  }

  /* ---------- Loading: show saved copy instantly, refresh from the sheet ---------- */
  async function loadProducts(onUpdate) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
    if (cached && cached.products && onUpdate) onUpdate(cached.products, true);

    const demo = new URLSearchParams(location.search).get("demo");
    const url = demo ? "sample.csv" : CFG.SHEET_URL + (CFG.SHEET_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const products = toProducts(parseCSV(await res.text()));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ products, at: Date.now() })); } catch (e) {}
      if (onUpdate) onUpdate(products, false);
      return products;
    } catch (err) {
      console.warn("Could not load the sheet:", err);
      if (cached && cached.products) return cached.products;
      throw err;
    }
  }

  /* ---------- Helpers ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Cloudinary: ask for a right-sized, compressed copy (fast on phones and data)
  function img(url, w) {
    if (!url) return "";
    if (/res\.cloudinary\.com/.test(url) && /\/image\/upload\//.test(url) && !/\/upload\/[^/]*(f_auto|w_\d)/.test(url))
      return url.replace("/upload/", "/upload/f_auto,q_auto,w_" + (w || 800) + "/");
    return url;
  }
  function videoInfo(url) {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return { type: "youtube", id: yt[1], poster: "https://img.youtube.com/vi/" + yt[1] + "/hqdefault.jpg" };
    let poster = "";
    if (/res\.cloudinary\.com/.test(url) && /\/video\/upload\//.test(url))
      poster = url.replace("/video/upload/", "/video/upload/so_0,f_jpg,w_800/").replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg");
    return { type: "file", src: url, poster };
  }
  function money(p) {
    if (!p) return "";
    const n = Number(String(p).replace(/[^0-9.]/g, ""));
    if (!n) return p;
    return CFG.CURRENCY + n.toLocaleString("en-NG");
  }
  function productURL(code, extra) {
    const base = location.href.replace(/[^/]*([?#].*)?$/, "");
    return base + "product.html?code=" + encodeURIComponent(code) + (extra || "");
  }
  function whatsappURL(p) {
    const lines = [
      "Hello " + CFG.BUSINESS_NAME + ",",
      "I'm interested in this item:",
      "Product: " + p.name,
      "Code: " + p.code
    ];
    if (p.price) lines.push("Price: " + money(p.price));
    lines.push("Link: " + productURL(p.code));
    return "https://wa.me/" + (CFG.WHATSAPP || "") + "?text=" + encodeURIComponent(lines.join("\n"));
  }
  function generalWhatsApp() {
    return "https://wa.me/" + (CFG.WHATSAPP || "") + "?text=" + encodeURIComponent("Hello " + CFG.BUSINESS_NAME + ", I'd like to make an enquiry.");
  }
  function categories(products) {
    const m = new Map();
    products.forEach(p => m.set(p.category, (m.get(p.category) || 0) + 1));
    return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }
  const WA_ICON = '<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.4.7 4.7 1.9 6.6L3 29l7.100-2.200c1.800 1 3.800 1.500 5.900 1.500 7 0 12.600-5.600 12.600-12.500S23 3 16 3zm0 22.700c-1.900 0-3.700-.5-5.300-1.500l-.4-.2-4.200 1.300 1.400-4-.3-.4a10 10 0 0 1-1.600-5.400C5.600 10 10.300 5.500 16 5.500S26.400 10 26.400 15.600 21.700 25.700 16 25.700zm5.700-7.500c-.3-.2-1.800-.9-2.100-1s-.5-.2-.7.200-.8 1-1 1.200-.4.200-.7.100a8.300 8.300 0 0 1-4.100-3.600c-.3-.5.300-.5.900-1.600.1-.2 0-.4 0-.5l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400s-1 1-1 2.400 1 2.800 1.200 3 2 3.100 4.900 4.300c1.800.8 2.600.9 3.500.8.600-.1 1.800-.7 2-1.400s.2-1.300.2-1.400-.3-.2-.6-.4z"/></svg>';

  window.Iyk = { CFG, loadProducts, esc, img, videoInfo, money, productURL, whatsappURL, generalWhatsApp, categories, WA_ICON };
})();
