/* TV slideshow: cycles products, plays videos, refreshes from the sheet every 10 minutes.
   Optional: tv.html?cat=Tiles  shows one category only. */
(function () {
  const { CFG, esc, img, money, videoInfo, loadProducts, WA_ICON } = window.Iyk;
  const stage = document.getElementById("stage"), bar = document.getElementById("progress");
  const only = new URLSearchParams(location.search).get("cat");
  let list = [], i = -1, timer, cur, busy = false;

  document.getElementById("brandbar").innerHTML =
    (CFG.LOGO ? `<img src="${esc(CFG.LOGO)}" alt="">` : "") + `<span>${esc(CFG.BUSINESS_NAME)}</span>`;

  function setList(products) {
    let l = products.filter(p => !p.out && (p.images[0] || p.videos[0]));
    if (only) l = l.filter(p => p.category.toLowerCase() === only.toLowerCase());
    // featured items appear twice as often
    list = l.flatMap(p => p.featured ? [p, p] : [p]);
    // light shuffle so the same order isn't always shown, but stable between refreshes
    list.sort((a, b) => a.order - b.order);
  }

  function slideHTML(p) {
    const vid = p.videos[0] ? videoInfo(p.videos[0]) : null;
    const useVideo = vid && vid.type === "file";
    const photo = p.images[0] ? img(p.images[0], 1400) : (vid && vid.poster) || "";
    const media = useVideo
      ? `<video class="main-vid" src="${esc(vid.src)}" muted playsinline ${photo ? `poster="${esc(photo)}"` : ""}></video>`
      : `<img class="bg" src="${esc(photo)}" alt=""><img src="${esc(photo)}" alt="${esc(p.name)}">`;
    return `<div class="slide" data-has-video="${useVideo ? 1 : 0}">
      <div class="media">${media}</div>
      <div class="text"><div class="kicker">${esc(p.category)}</div><h2>${esc(p.name)}</h2>
        <div class="meta">Product No. ${esc(p.code)}${p.specs.slice(0, 3).map(s => ` · ${esc(s[1])}`).join("")}</div>
        <div class="price ${p.price ? "" : "ask"}">${p.price ? esc(money(p.price)) : "Ask in store for price"}</div>
        <div class="cta-line">Ask our team, or WhatsApp us the product number <b>${esc(p.code)}</b></div></div></div>`;
  }

  function next(step) {
    if (!list.length || busy) return;
    busy = true; clearTimeout(timer);
    i = (i + (step || 1) + list.length) % list.length;
    const el = document.createElement("div"); el.innerHTML = slideHTML(list[i]);
    const slide = el.firstElementChild; stage.appendChild(slide);
    const old = cur; cur = slide;
    requestAnimationFrame(() => requestAnimationFrame(() => { slide.classList.add("on"); if (old) old.classList.remove("on"); }));
    setTimeout(() => { if (old) old.remove(); busy = false; }, 1100);

    let ms = CFG.TV_SECONDS_PER_SLIDE * 1000;
    const v = slide.querySelector(".main-vid");
    if (v) {
      const go = () => { clearTimeout(timer); next(1); };
      v.addEventListener("error", go, { once: true });
      v.play().then(() => {
        v.addEventListener("ended", go, { once: true });
        ms = Math.min(25000, Math.max(ms, ((v.duration || 0) * 1000) || ms));
        run(ms);
      }).catch(() => run(ms));
    } else run(ms);
  }
  function run(ms) {
    bar.style.transition = "none"; bar.style.width = "0";
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = "width " + ms + "ms linear"; bar.style.width = "100%"; }));
    timer = setTimeout(() => next(1), ms);
  }

  function empty(msg) { stage.innerHTML = `<div style="height:100vh;display:grid;place-items:center;color:#aaa;font-size:2vw;text-align:center;padding:5vw">${msg}</div>`; }

  loadProducts(p => { const had = list.length; setList(p); if (!had && list.length) { stage.innerHTML = ""; next(1); } })
    .then(() => { if (!list.length) empty("No products with photos yet.<br>Add image links in the Google Sheet."); })
    .catch(() => empty("Can't load the products. Check the internet connection."));

  setInterval(() => loadProducts(setList).catch(() => {}), 10 * 60 * 1000);

  // Menu button: appears for a few seconds when someone touches the remote or mouse
  const menu = document.createElement("a"); menu.id = "tvmenu"; menu.href = "screen.html?choose=1"; menu.textContent = "☰ Menu";
  document.body.appendChild(menu);
  let mt; const showMenu = () => { menu.classList.add("show"); clearTimeout(mt); mt = setTimeout(() => menu.classList.remove("show"), 6000); };
  ["keydown", "mousemove", "touchstart"].forEach(ev => document.addEventListener(ev, showMenu, { passive: true }));
  // Fresh start every 3 hours keeps a TV browser running smoothly all day (data is still cached, so no gap)
  setTimeout(() => location.reload(), 3 * 60 * 60 * 1000);

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") next(1); else if (e.key === "ArrowLeft") next(-1);
    else if (e.key.toLowerCase() === "f") toggleFS();
  });
  document.addEventListener("click", e => { if (!e.target.closest("#tvmenu")) toggleFS(); });
  function toggleFS() { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
  // Keep the screen awake where supported
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
})();
