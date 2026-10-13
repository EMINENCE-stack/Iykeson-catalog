/* Product card + grid rendering shared by the home page and the in-store page */
window.Iyk.cardHTML = function (p, extra) {
  const { esc, img, money } = window.Iyk;
  const pic = p.images[0] ? `<img loading="lazy" src="${esc(img(p.images[0], 500))}" alt="${esc(p.name)}">` : `<div class="noimg">No photo yet</div>`;
  return `<a class="card" href="product.html?code=${encodeURIComponent(p.code)}${extra || ""}">
    <div class="ph">${pic}
      ${p.out ? '<span class="badge dark">Out of stock</span>' : p.featured ? '<span class="badge">Featured</span>' : ""}
      ${p.videos.length ? '<span class="badge vid">▶ Video</span>' : ""}
    </div>
    <div class="info"><span class="cat-label">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3><span class="code">Code: ${esc(p.code)}</span>
      <span class="price ${p.price ? "" : "ask"}">${p.price ? esc(money(p.price)) : "Ask for price"}</span></div></a>`;
};
window.Iyk.searchText = p => (p.name + " " + p.code + " " + p.category + " " + p.description + " " + p.specs.map(s => s[1]).join(" ")).toLowerCase();
