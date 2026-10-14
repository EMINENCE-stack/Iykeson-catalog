/* In-store screen: big search + categories. Shows only items in stock unless "In stock only" is switched off.
   Works with a touch screen OR a TV remote (arrow keys + OK). Resets itself after 90 seconds of no use. */
(function () {
  const { CFG, esc, loadProducts, categories, cardHTML, searchText } = window.Iyk;
  const $ = id => document.getElementById(id);
  let all = [], cat = "All", onlyAvail = true, idle;
  $("title").textContent = CFG.SHORT_NAME + " · Find your product";

  // link back to the screen chooser
  const sw = document.createElement("a");
  sw.className = "btn btn-ghost"; sw.href = "screen.html?choose=1"; sw.textContent = "Switch screen";
  $("title").insertAdjacentElement("afterend", sw);
  sw.style.marginLeft = "auto"; document.querySelector(".top .home").style.marginLeft = "0";

  const visible = () => all.filter(p => !onlyAvail || !p.out);

  function renderChips() {
    const list = categories(visible());
    $("chips").innerHTML =
      `<button class="chip toggle ${onlyAvail ? "on" : ""}" data-toggle="1">${onlyAvail ? "✓ In stock only" : "Showing all items"}</button>` +
      ["All"].concat(list.map(c => c.name)).map(n => `<button class="chip ${n === cat ? "on" : ""}" data-cat="${esc(n)}">${esc(n)}</button>`).join("");
  }
  function renderGrid() {
    const q = $("q").value.trim().toLowerCase();
    const list = visible().filter(p => (cat === "All" || p.category === cat) && (!q || q.split(/\s+/).every(w => searchText(p).includes(w))));
    $("count").textContent = list.length + " product" + (list.length === 1 ? "" : "s") + (onlyAvail ? " available now" : "");
    $("grid").innerHTML = list.length ? list.map(p => cardHTML(p, "&from=store")).join("") :
      `<div class="empty" style="grid-column:1/-1">Nothing found. Please ask our staff for help.</div>`;
  }
  function reset() { cat = "All"; onlyAvail = true; $("q").value = ""; renderChips(); renderGrid(); window.scrollTo(0, 0); }
  function poke() { clearTimeout(idle); idle = setTimeout(reset, 90000); }
  ["touchstart", "click", "keydown", "scroll"].forEach(ev => document.addEventListener(ev, poke, { passive: true }));

  document.addEventListener("click", e => {
    const t = e.target.closest(".chip"); if (!t) return;
    if (t.dataset.toggle) onlyAvail = !onlyAvail; else cat = t.dataset.cat;
    if (!visible().some(p => p.category === cat)) cat = "All";
    renderChips(); renderGrid();
  });
  $("q").addEventListener("input", renderGrid);
  loadProducts(p => { all = p; if (!visible().some(x => x.category === cat)) cat = "All"; renderChips(); renderGrid(); })
    .catch(() => { $("grid").innerHTML = `<div class="empty" style="grid-column:1/-1">Can't load products. Check the internet connection.</div>`; });
  poke();
})();
