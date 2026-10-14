(function () {
  const { CFG, esc, img, loadProducts, categories, generalWhatsApp, cardHTML, searchText } = window.Iyk;
  const $ = id => document.getElementById(id);
  const setText = (id, t) => { const e = $(id); if (e && t) e.textContent = t; };
  let all = [], cat = "All";

  setText("hero-title", CFG.HERO_TITLE);
  setText("hero-tagline", CFG.TAGLINE);
  if ($("hero-wa")) $("hero-wa").href = generalWhatsApp();
  if (CFG.HERO_IMAGE && $("hero")) {
    $("hero").style.backgroundImage = `url("${img(CFG.HERO_IMAGE, 2000)}")`;
    $("hero").style.backgroundPosition = CFG.HERO_POSITION || "center 40%";   // which part of the photo stays visible
  }
  // Shop photo: works even if index.html has no #shop-photo box (it creates one)
  if (CFG.SHOP_IMAGE && $("contact")) {
    let box = $("shop-photo");
    if (!box) {
      box = document.createElement("div"); box.id = "shop-photo";
      const left = $("contact").querySelector(".two > div") || $("contact");
      left.appendChild(box);
    }
    box.innerHTML = `<figure class="shop-photo"><img loading="lazy" src="${esc(img(CFG.SHOP_IMAGE, 900))}" alt="Our shop front"><figcaption>Look out for this building</figcaption></figure>`;
  }
  if ($("contact-list")) $("contact-list").innerHTML =
    `<li><strong>Address</strong><br>${esc(CFG.ADDRESS)}</li>` +
    `<li><strong>Opening hours</strong><br>${esc(CFG.OPENING_HOURS)}</li>` +
    (CFG.PHONE_DISPLAY ? `<li><strong>Phone</strong><br>${esc(CFG.PHONE_DISPLAY)}</li>` : "") +
    (CFG.MAPS_LINK ? `<li><a class="btn btn-red" href="${esc(CFG.MAPS_LINK)}" target="_blank" rel="noopener">Get directions</a></li>` : "") +
    `<li><a class="btn btn-wa" href="${generalWhatsApp()}" target="_blank" rel="noopener">Message us on WhatsApp</a></li>`;

  function priceNum(p) { const n = Number(String(p.price).replace(/[^0-9.]/g, "")); return n || null; }

  function renderCats() {
    const list = categories(all);
    $("cats").innerHTML = list.map(c => {
      const p = all.find(x => x.category === c.name && x.images[0]);
      const bg = p ? `style="background-image:url('${esc(img(p.images[0], 500))}')"` : "";
      return `<button class="cat" data-cat="${esc(c.name)}" ${bg}><span><b>${esc(c.name)}</b><small>${c.count} item${c.count > 1 ? "s" : ""}</small></span></button>`;
    }).join("");
    $("chips").innerHTML = ["All"].concat(list.map(c => c.name)).map(n =>
      `<button class="chip ${n === cat ? "on" : ""}" data-cat="${esc(n)}">${esc(n)}</button>`).join("");
  }

  function renderGrid() {
    const q = $("q").value.trim().toLowerCase();
    let list = all.filter(p => (cat === "All" || p.category === cat) && (!q || q.split(/\s+/).every(w => searchText(p).includes(w))));
    const s = $("sort").value;
    if (s === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "low") list.sort((a, b) => (priceNum(a) ?? 1e12) - (priceNum(b) ?? 1e12));
    if (s === "high") list.sort((a, b) => (priceNum(b) ?? -1) - (priceNum(a) ?? -1));
    $("count").textContent = list.length + " product" + (list.length === 1 ? "" : "s") + (cat !== "All" ? " in " + cat : "");
    $("grid").innerHTML = list.length ? list.map(p => cardHTML(p)).join("") :
      `<div class="empty" style="grid-column:1/-1">Nothing matches that search. Try fewer words, or <a style="text-decoration:underline" href="${generalWhatsApp()}" target="_blank" rel="noopener">ask us on WhatsApp</a>.</div>`;
  }

  function setCat(n, scroll) {
    cat = n; renderCats(); renderGrid();
    if (scroll) $("products").scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-cat]"); if (!t) return;
    setCat(t.dataset.cat, !!t.closest("#cats"));
  });
  $("q").addEventListener("input", renderGrid);
  $("sort").addEventListener("change", renderGrid);

  function show(products) {
    all = products;
    if (!all.some(p => p.category === cat)) cat = "All";
    renderCats(); renderGrid();
  }

  loadProducts((p) => show(p)).catch(() => {
    $("grid").innerHTML = `<div class="empty" style="grid-column:1/-1">We couldn't load the products right now. Please check your internet and refresh, or <a style="text-decoration:underline" href="${generalWhatsApp()}">message us on WhatsApp</a>.</div>`;
    $("cats").innerHTML = "";
  });
})();
