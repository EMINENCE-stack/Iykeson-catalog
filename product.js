(function () {
  const { CFG, esc, img, money, videoInfo, loadProducts, whatsappURL, WA_ICON, cardHTML } = window.Iyk;
  const params = new URLSearchParams(location.search);
  const code = params.get("code"), fromStore = params.get("from") === "store";
  const main = document.getElementById("main");

  function render(all) {
    const p = all.find(x => x.code.toLowerCase() === String(code).toLowerCase());
    if (!p) {
      main.innerHTML = `<div class="crumbs"><a href="index.html">Home</a></div>
        <div class="empty" style="margin-bottom:48px">We couldn't find that product. It may have been removed. <a style="text-decoration:underline" href="index.html#products">See all products</a>.</div>`;
      return;
    }
    document.title = p.name + " | " + CFG.BUSINESS_NAME;
    // gallery items: photos first, then videos
    const items = p.images.map(u => ({ t: "img", u })).concat(p.videos.map(u => ({ t: "vid", v: videoInfo(u) })));
    const back = fromStore ? `<a href="store.html">← Back to store display</a>` : `<a href="index.html">Home</a> / <a href="index.html#products">Products</a>`;
    const wa = whatsappURL(p);
    main.innerHTML = `
      <div class="crumbs">${back} / ${esc(p.name)}</div>
      <article class="pdp">
        <div>
          <div class="stage" id="stage"></div>
          <div class="thumbs" id="thumbs"></div>
        </div>
        <div>
          <span class="cat-label">${esc(p.category)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="${p.price ? "big-price" : "big-price ask"}">${p.price ? esc(money(p.price)) : "Ask for price"}</div>
          <span class="pill ${p.out ? "out" : ""}">${p.out ? "Currently out of stock" : "Available"}</span>
          ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
          <table class="specs"><tbody>
            <tr><th>Product code</th><td>${esc(p.code)}</td></tr>
            ${p.specs.map(s => `<tr><th>${esc(s[0])}</th><td>${esc(s[1])}</td></tr>`).join("")}
          </tbody></table>
          <div class="cta">
            <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${WA_ICON} Enquire on WhatsApp</a>
            <p class="note">Opens WhatsApp with this product already filled in, so we know exactly which item you mean.</p>
          </div>
        </div>
      </article>
      <div class="sticky-cta"><a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${WA_ICON} Enquire on WhatsApp</a></div>`;

    const stage = document.getElementById("stage"), thumbs = document.getElementById("thumbs");
    function show(i) {
      const it = items[i];
      [...thumbs.children].forEach((t, k) => t.classList.toggle("on", k === i));
      stage.classList.toggle("is-video", !!it && it.t === "vid");
      if (!it) { stage.innerHTML = `<div class="noimg">Photo coming soon</div>`; return; }
      if (it.t === "img") stage.innerHTML = `<img src="${esc(img(it.u, 1200))}" alt="${esc(p.name)}" data-full="${esc(img(it.u, 2000))}">`;
      else if (it.v.type === "youtube") stage.innerHTML = `<iframe src="https://www.youtube.com/embed/${it.v.id}?rel=0" allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowfullscreen title="Product video"></iframe>`;
      else stage.innerHTML = `<video src="${esc(it.v.src)}" ${it.v.poster ? `poster="${esc(it.v.poster)}"` : ""} controls playsinline preload="metadata"></video>`;
    }
    thumbs.innerHTML = items.length > 1 ? items.map((it, i) => {
      const src = it.t === "img" ? img(it.u, 160) : it.v.poster;
      return `<button class="thumb" data-i="${i}" aria-label="Show ${it.t === "img" ? "photo" : "video"} ${i + 1}">${src ? `<img src="${esc(src)}" alt="">` : ""}${it.t === "vid" ? '<span class="play">▶</span>' : ""}</button>`;
    }).join("") : "";
    thumbs.addEventListener("click", e => { const b = e.target.closest(".thumb"); if (b) show(+b.dataset.i); });
    show(0);

    const lb = document.getElementById("lb");
    stage.addEventListener("click", e => {
      const im = e.target.closest("img[data-full]"); if (!im) return;
      lb.querySelector("img").src = im.dataset.full; lb.classList.add("open");
    });
    lb.addEventListener("click", () => lb.classList.remove("open"));
    document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("open"); });

    const rel = all.filter(x => x.category === p.category && x.code !== p.code).slice(0, 4);
    if (rel.length) {
      document.getElementById("related").innerHTML = rel.map(x => cardHTML(x)).join("");
      document.getElementById("related-sec").style.display = "block";
    }
  }
  loadProducts(render).catch(() => {
    main.innerHTML = `<div class="crumbs"><a href="index.html">Home</a></div><div class="empty" style="margin-bottom:48px">We couldn't load this product. Check your internet and refresh.</div>`;
  });
})();
