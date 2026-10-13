/* In-store touch screen: big buttons, big search. Resets itself after 90 seconds of nobody touching it. */
(function () {
  const { CFG, esc, loadProducts, categories, cardHTML, searchText } = window.Iyk;
  const $ = id => document.getElementById(id);
  let all = [], cat = "All", idle;
  $("title").textContent = CFG.SHORT_NAME + " · Find your product";

  function renderChips() {
    $("chips").innerHTML = ["All"].concat(categories(all).map(c => c.name)).map(n =>
      `<button class="chip ${n === cat ? "on" : ""}" data-cat="${esc(n)}">${esc(n)}</button>`).join("");
  }
  function renderGrid() {
    const q = $("q").value.trim().toLowerCase();
    const list = all.filter(p => (cat === "All" || p.category === cat) && (!q || q.split(/\s+/).every(w => searchText(p).includes(w))));
    $("count").textContent = list.length + " product" + (list.length === 1 ? "" : "s");
    $("grid").innerHTML = list.length ? list.map(p => cardHTML(p, "&from=store")).join("") :
      `<div class="empty" style="grid-column:1/-1">Nothing found. Please ask our staff for help.</div>`;
  }
  function reset() { cat = "All"; $("q").value = ""; renderChips(); renderGrid(); window.scrollTo(0, 0); }
  function poke() { clearTimeout(idle); idle = setTimeout(reset, 90000); }
  ["touchstart", "click", "keydown", "scroll"].forEach(ev => document.addEventListener(ev, poke, { passive: true }));

  document.addEventListener("click", e => { const t = e.target.closest(".chip"); if (t) { cat = t.dataset.cat; renderChips(); renderGrid(); } });
  $("q").addEventListener("input", renderGrid);
  loadProducts(p => { all = p; if (!all.some(x => x.category === cat)) cat = "All"; renderChips(); renderGrid(); })
    .catch(() => { $("grid").innerHTML = `<div class="empty" style="grid-column:1/-1">Can't load products. Check the internet connection.</div>`; });
  poke();
})();
