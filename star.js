// Étoile d'ouverture : elle longe les cimes de gauche à droite, éclate en feu d'artifice
// juste à droite des tuiles, et le soleil apparaît à cet endroit.
function starIntro() {
  const svg = [...document.querySelectorAll("#ridge .scene")].find(s => getComputedStyle(s).display !== "none");
  const sun = svg && svg.querySelector(".sk-sun");
  const peaks = svg && svg.querySelector(".sk-alps");
  const tiles = document.querySelector(".tiles");
  if (!svg || !sun || !peaks || !tiles) return;

  const NS = "http://www.w3.org/2000/svg";
  const toScr = (x, y) => { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(peaks.getScreenCTM()); };
  const toSvg = (x, y) => { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(peaks.getScreenCTM().inverse()); };
  const L = peaks.getTotalLength();
  const at = p => { const pt = peaks.getPointAtLength(Math.max(0, Math.min(1, p)) * L); return toScr(pt.x, pt.y); };
  const findX = x => { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; at(m).x < x ? a = m : b = m; } return a; };

  // point d'explosion : juste à droite des tuiles (sur téléphone : au-dessus de la dernière tuile)
  const tr = tiles.getBoundingClientRect(), wide = innerWidth - tr.right > 70;
  // sur téléphone (pas de place à côté des tuiles) : pas d'animation, le soleil est simplement affiché
  if (!wide) { sun.classList.add("sun-on"); return; }
  const bx = wide ? tr.right + Math.min(70, (innerWidth - tr.right) / 2) : tr.right - 34;
  const pEnd = findX(bx), ridgeY = at(pEnd).y;
  let by = wide ? Math.min(ridgeY - 46, tr.top + 10) : tr.top - 30;
  // le soleil doit rester entièrement dans le dessin (sinon il est coupé en haut)
  const sr = svg.getBoundingClientRect(), rpx = 30 * peaks.getScreenCTM().a;
  by = Math.max(by, sr.top + rpx * 1.25);

  // le soleil prend la place de l'explosion
  const s = toSvg(bx, by);
  sun.setAttribute("cx", s.x.toFixed(1)); sun.setAttribute("cy", s.y.toFixed(1));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { sun.classList.add("sun-on"); return; }

  const over = document.createElementNS(NS, "svg");
  over.setAttribute("class", "intro-layer"); over.setAttribute("aria-hidden", "true");
  const host = document.querySelector(".hub-main") || document.body;
  host.appendChild(over);
  // l'étoile passe derrière les tuiles : calque placé entre le paysage et le contenu
  const off = () => { const r = host.getBoundingClientRect(); return [r.left, r.top]; };
  const R = 9, k = R * 0.28;
  const trail = [...Array(10)].map((_, i) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", (2.6 - i * 0.2).toFixed(1)); c.setAttribute("class", "intro-trail"); c.style.opacity = 0;
    over.appendChild(c); return c;
  });
  const star = document.createElementNS(NS, "g");
  star.setAttribute("class", "intro-star");
  star.innerHTML = `<path d="M0 ${-R * 1.6} Q${k} ${-k} ${R * 1.6} 0 Q${k} ${k} 0 ${R * 1.6} Q${-k} ${k} ${-R * 1.6} 0 Q${-k} ${-k} 0 ${-R * 1.6}Z"/>`;
  over.appendChild(star);
  const hist = [];
  const place = (x, y, sc) => {
    const [ox, oy] = off(); x -= ox; y -= oy;
    star.setAttribute("transform", `translate(${x} ${y}) scale(${sc}) rotate(${(performance.now() / 6) % 360})`);
    hist.unshift([x, y]); hist.length = Math.min(hist.length, 40);
    trail.forEach((c, i) => { const h = hist[i * 3]; if (h) { c.setAttribute("cx", h[0]); c.setAttribute("cy", h[1]); c.style.opacity = (0.8 - i * 0.075).toFixed(2); } });
  };

  const p0 = findX(4), LIFT = 12; // l'étoile vole juste au-dessus des cimes
  const RUN = 4200, HOP = 600, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  let t0 = null;
  const run = now => {
    t0 ??= now;
    const t = Math.min(1, (now - t0) / RUN), pt = at(p0 + (pEnd - p0) * ease(t));
    place(pt.x, pt.y - LIFT, 1 + 0.12 * Math.sin(now / 80));
    if (t < 1) return requestAnimationFrame(run);
    hop(pt.x, pt.y - LIFT);
  };
  const hop = (fx, fy) => {
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / HOP), e = t * t * (3 - 2 * t);
      place(fx + (bx - fx) * e, fy + (by - fy) * e - Math.sin(Math.PI * e) * 22, 1 + e * 0.5);
      if (t < 1) return requestAnimationFrame(step);
      burst();
    };
    requestAnimationFrame(step);
  };
  const burst = () => {
    star.remove(); trail.forEach(c => c.remove());
    const g = document.createElementNS(NS, "g");
    const [ox, oy] = off();
    g.setAttribute("transform", `translate(${bx - ox} ${by - oy})`);
    over.appendChild(g);
    const flash = document.createElementNS(NS, "circle");
    flash.setAttribute("r", 14); flash.setAttribute("class", "intro-flash"); g.appendChild(flash);
    flash.animate([{ transform: "scale(.3)", opacity: 1 }, { transform: "scale(4)", opacity: 0 }], { duration: 700, easing: "ease-out", fill: "forwards" });
    const colors = ["#ffd166", "#ffb347", "#ffffff", "#7aa6ff", "#2350d6", "#ffe8a3"];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.2, d = 46 + Math.random() * 38;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", (2.2 + Math.random() * 2).toFixed(1)); c.setAttribute("fill", colors[i % colors.length]);
      g.appendChild(c);
      c.animate([
        { transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d * .8}px,${Math.sin(a) * d * .8}px)`, opacity: 1, offset: .55 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 18}px)`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 450, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
    }
    setTimeout(() => sun.classList.add("sun-on"), 180);
    setTimeout(() => over.remove(), 1900);
  };
  requestAnimationFrame(run);
}
