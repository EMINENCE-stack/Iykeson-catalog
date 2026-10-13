/* Header, footer and floating WhatsApp button, shared by all public pages */
(function () {
  const { CFG, esc, generalWhatsApp, WA_ICON } = window.Iyk;
  const logo = CFG.LOGO
    ? `<img src="${esc(CFG.LOGO)}" alt="${esc(CFG.BUSINESS_NAME)}">`
    : `<span class="mark">I</span>`;
  const header = document.getElementById("site-header");
  if (header) header.innerHTML = `
  <header class="site-header"><div class="wrap bar">
    <a class="brand" href="index.html">${logo}<span>${esc(CFG.SHORT_NAME)}<small>BATHROOM &amp; TILES DEPOT</small></span></a>
    <button class="menu-btn" id="menu-btn" aria-expanded="false">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="index.html#categories">Categories</a>
      <a href="index.html#products">All products</a>
      <a href="index.html#contact">Visit us</a>
      <a class="btn btn-wa btn-sm" href="${generalWhatsApp()}" target="_blank" rel="noopener">${WA_ICON} WhatsApp</a>
    </nav></div></header>`;
  const btn = document.getElementById("menu-btn"), nav = document.getElementById("nav");
  if (btn) btn.onclick = () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o); };
  if (nav) nav.addEventListener("click", e => { if (e.target.closest("a")) nav.classList.remove("open"); });

  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = `
  <footer><div class="wrap">
    <div>&copy; ${new Date().getFullYear()} ${esc(CFG.BUSINESS_NAME)}</div>
    <div><a href="store.html">In-store display</a> &nbsp;·&nbsp; <a href="tv.html">TV mode</a></div>
  </div></footer>
  <a class="float-wa" href="${generalWhatsApp()}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_ICON}</a>`;
})();
