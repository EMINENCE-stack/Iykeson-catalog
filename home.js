(function () {
  const { CFG, esc, img, loadProducts, categories, generalWhatsApp, cardHTML, searchText } = window.Iyk;
  const $ = id => document.getElementById(id);
  let all = [], cat = "All";

  document.getElementById("hero-tagline").textContent = CFG.TAGLINE;
  $("hero-wa").href = generalWhatsApp();
  if (CFG.HERO_IMAGE) $("hero").style.backgroundImage = `url("${img(CFG.HERO_IMAGE, 1600)}")`;
  $("contact-list").innerHTML =
    `<li><strong>Address</strong><br>${esc(CFG.ADDRESS)}</li>` +
    `<li><strong>Opening hours</strong><br>${esc(CFG.OPENING_HOURS)}</li>` +
    (CFG.PHONE_DISPLAY ? `<li><strong>Phone</strong><br>${esc(CFG.PHONE_DISPLAY)}</li>` : "") +
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
