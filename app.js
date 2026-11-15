// Contenu modifiable dans /content/*.json (via l'espace admin /admin)
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const telHref = t => "tel:+33" + t.replace(/\D/g, "").replace(/^0/, "");
const load = f => fetch("content/" + f + ".json", { cache: "no-cache" }).then(r => r.json());

function md(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[(.+?)\]\(((?:https?:\/\/|[\w-]+\.html)[^)\s]*)\)/g, '<a href="$2">$1</a>');
  let html = "", list = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const line of String(src || "").split("\n")) {
    let m;
    if ((m = line.match(/^(#{2,3})\s+(.*)/))) { close(); html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
    else if ((m = line.match(/^\s*[-*]\s+(.*)/))) { if (list !== "ul") { close(); html += "<ul>"; list = "ul"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = line.match(/^\s*\d+\.\s+(.*)/))) { if (list !== "ol") { close(); html += "<ol>"; list = "ol"; } html += `<li>${inline(m[1])}</li>`; }
    else if (line.trim()) { close(); html += `<p>${inline(line)}</p>`; }
    else close();
  }
  close();
  return html;
}

function videoEmbed(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Vidéo" allowfullscreen loading="lazy"></iframe></div>` : "";
}

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
function openNow(site) {
  const now = new Date(), day = site.horaires.find(h => h.jour === DAYS[now.getDay()]);
  if (!day) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  const ranges = [day.matin, day.apres_midi].join(" ").match(/(\d{1,2})h(\d{2})\s*[–-]\s*(\d{1,2})h(\d{2})/g) || [];
  return ranges.some(r => { const [a, b, c, d] = r.match(/\d+/g).map(Number); return mins >= a * 60 + b && mins < c * 60 + d; });
}

function chrome(site, page, opts = {}) {
  const links = [["rdv.html", "Rendez-vous", "rdv"], ["equipe.html", "L'équipe", "equipe"], ["conseils.html", "Conseils", "conseils"], ["suivi.html", "Mon suivi", "suivi"], ["orientation.html", "M'orienter", "orientation"], ["faq.html", "FAQ", "faq"], ["acces.html", "Accès", "acces"]];
  const nav = links.map(([h, t, k]) => `<a href="${h}" class="${k === page ? "on" : ""}">${t}</a>`).join("") + `<a href="urgence.html" class="urg">Urgence</a>`;
  document.body.insertAdjacentHTML("afterbegin",
    (site.bandeau_actif && site.bandeau_texte ? `<div class="bandeau">${esc(site.bandeau_texte)}</div>` : "") +
    `<header class="site"><div class="wrap">
      <a class="logo" href="index.html"><svg viewBox="0 0 40 16" aria-hidden="true"><path d="M1 13 C6 12 8 6 13 7 S20 2 24 3 S31 10 39 8"/></svg><span class="logo-txt"><b>Mes yeux <i>ligne bleue</i></b><span>Dr Laurent Subiger · Ophtalmologie · Belfort</span></span></a>
      ${opts.noFooter ? `<a href="urgence.html" class="urg-head">Urgence</a>` : `<nav class="main" id="nav">${nav}</nav>`}
      <button class="confort-btn" id="confort" aria-pressed="false" title="Agrandir le texte et augmenter le contraste">Aa <span>Confort de lecture</span></button>
      ${opts.noFooter ? "" : `<button class="menu-btn" onclick="document.getElementById('nav').classList.toggle('open')" aria-label="Ouvrir le menu"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`}
    </div></header>`);
  const TITLES = { rdv: "Horaires & rendez-vous", equipe: "L'équipe", conseils: "Conseils santé", suivi: "Mon suivi", operation: "Après mon opération", orientation: "M'orienter", faq: "Questions fréquentes", acces: "Venir au cabinet", actualites: "Actualités", urgence: "Urgence" };
  if (!opts.noFooter) {
    $("header.site").insertAdjacentHTML("afterend", `<div class="backbar"><div class="wrap"><a href="index.html" id="back"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Retour</a><span class="crumb"><a href="index.html">Accueil</a>${TITLES[page] ? ` › ${TITLES[page]}` : ""}</span></div></div>`);
    $("#back").onclick = e => {
      let same = false; try { same = new URL(document.referrer).origin === location.origin; } catch {}
      if (same && history.length > 1) { e.preventDefault(); history.back(); }
    };
    document.body.insertAdjacentHTML("beforeend", `<nav class="tabbar" aria-label="Raccourcis">
      <a href="index.html" class="${page === "accueil" ? "on" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>Accueil</a>
      <a href="${telHref(site.telephone)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>Appeler</a>
      <a href="suivi.html" class="${page === "suivi" ? "on" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Mon suivi</a>
      <a href="urgence.html" class="urg ${page === "urgence" ? "on" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>Urgence</a>
    </nav>`);
  }
  if (!opts.noFooter) document.body.insertAdjacentHTML("beforeend",
    `<footer class="site"><div class="wrap"><div class="grid">
      <div><div class="line"></div><h4>${esc(site.nom_cabinet)}</h4><p>${esc(site.adresse)}<br>${esc(site.ville)}<br>Tél. <a href="${telHref(site.telephone)}">${esc(site.telephone)}</a></p></div>
      <div><h4>Pages</h4><p><a href="rdv.html">Horaires &amp; rendez-vous</a><br><a href="equipe.html">L'équipe</a><br><a href="conseils.html">Conseils santé</a><br><a href="suivi.html">Mon suivi</a><br><a href="operation.html">Après mon opération</a><br><a href="orientation.html">M'orienter</a><br><a href="faq.html">Questions fréquentes</a><br><a href="acces.html">Accès</a><br><a href="actualites.html">Actualités</a><br><a href="urgence.html">Urgence</a></p></div>
      <div><h4>Urgence vitale</h4><p>Appelez le <a href="tel:15">15</a> ou le <a href="tel:112">112</a></p></div>
    </div><div class="small"><span>© ${new Date().getFullYear()} Cabinet du Dr Laurent Subiger</span><a href="mentions.html">Mentions légales</a></div></div></footer>`);
}

function fill(site) {
  document.querySelectorAll("[data-site]").forEach(el => { el.textContent = site[el.dataset.site] ?? ""; });
  document.querySelectorAll("[data-tel]").forEach(el => { el.href = telHref(site.telephone); if (!el.textContent.trim()) el.textContent = site.telephone; });
  document.querySelectorAll("[data-list]").forEach(el => { el.innerHTML = (site[el.dataset.list] || []).map(i => `<li>${esc(i)}</li>`).join(""); });
  const tb = $("#horaires");
  if (tb) tb.innerHTML = site.horaires.map(h => `<tr class="${h.jour === DAYS[new Date().getDay()] ? "today" : ""}"><td>${esc(h.jour)}</td><td>${esc(h.matin)}</td><td>${esc(h.apres_midi)}</td></tr>`).join("");
  const st = $("#status");
  if (st) { const o = openNow(site); st.classList.add(o ? "open" : "closed"); st.textContent = o ? "Le secrétariat est joignable maintenant" : "Le cabinet est fermé en ce moment"; }
}

const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
function confort() {
  const on = store.get("confort", false);
  document.documentElement.classList.toggle("confort", on);
  const b = $("#confort"); if (!b) return;
  b.setAttribute("aria-pressed", on);
  b.onclick = () => { store.set("confort", !on); confort(); };
}
document.documentElement.classList.toggle("confort", store.get("confort", false));

async function init(page, opts) {
  const site = await load("site");
  chrome(site, page, opts);
  confort();
  fill(site);
  return site;
}

// --- Accueil : actualités
async function renderNews(el, max) {
  const { items } = await load("actualites");
  const list = items.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, max || 99);
  el.innerHTML = list.length ? list.map(n => `<article><time>${new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time><h3>${esc(n.titre)}</h3><div>${md(n.texte)}</div></article>`).join("") : `<p class="muted">Aucune actualité pour le moment.</p>`;
}

// --- Conseils santé
async function renderFiches() {
  const { items } = await load("fiches");
  const listEl = $("#liste"), detail = $("#detail"), filters = $("#filters");
  const themes = [...new Set(items.map(f => f.theme))];
  let theme = "";
  const badge = f => f.valide ? "" : `<span class="badge">Brouillon à valider</span>`;
  const drawList = () => {
    listEl.innerHTML = items.filter(f => !theme || f.theme === theme).map(f => `<a class="fiche-card" href="#${f.slug}"><span class="theme">${esc(f.theme)}</span><h3>${esc(f.titre)}${badge(f)}</h3><p>${esc(f.resume)}</p><span class="arrow" style="color:var(--blue);font-weight:600;font-size:.9rem">Lire la fiche →</span></a>`).join("");
    filters.innerHTML = ["", ...themes].map(t => `<button class="${t === theme ? "on" : ""}" data-t="${esc(t)}">${t ? esc(t) : "Tout"}</button>`).join("");
  };
  filters.addEventListener("click", e => { if (e.target.dataset.t !== undefined) { theme = e.target.dataset.t; drawList(); } });
  const route = () => {
    const f = items.find(x => x.slug === location.hash.slice(1));
    $("#vue-liste").hidden = !!f; detail.hidden = !f;
    if (f) {
      detail.innerHTML = `<p><a href="#">← Toutes les fiches</a></p><div class="kicker">${esc(f.theme)}</div><h1>${esc(f.titre)}${badge(f)}</h1><p class="lead muted" style="font-size:1.15rem">${esc(f.resume)}</p>${videoEmbed(f.video)}<div class="prose">${md(f.contenu)}</div><p class="disclaimer">Ces informations sont générales et ne remplacent pas une consultation. En cas de doute, appelez le cabinet.</p>`;
      scrollTo(0, 0);
    }
  };
  drawList(); route(); addEventListener("hashchange", route);
}

// --- Arbre décisionnel
async function renderTree(site) {
  const t = await load("orientation"), box = $("#tree");
  const node = id => t.noeuds.find(n => n.id === id), res = id => t.resultats.find(r => r.id === id);
  const labels = { vital: "Urgence vitale", urgent: "Urgent", rapide: "Rapidement", conseil: "Conseil", rdv: "Rendez-vous" };
  let path = [];
  const show = id => {
    const n = node(id), r = res(id);
    const crumbs = path.length ? `<div class="crumbs">${path.map(p => esc(p)).join(" › ")} · <a href="#" data-restart>Recommencer</a></div>` : "";
    if (n) {
      box.innerHTML = crumbs + `<div class="q">${esc(n.question)}</div><div class="opts">${n.options.map((o, i) => `<button data-i="${i}">${esc(o.label)}</button>`).join("")}</div>`;
      box.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const o = n.options[b.dataset.i]; path.push(o.label); show(o.suite); });
    } else if (r) {
      const actions = r.niveau === "vital" ? `<a class="btn btn-red" href="tel:15">Appeler le 15</a>`
        : r.niveau === "urgent" ? `<a class="btn btn-primary" href="${telHref(site.telephone)}">Appeler le cabinet · ${esc(site.telephone)}</a><a class="btn btn-ghost" href="urgence.html">Cabinet fermé ?</a>`
        : `<a class="btn btn-primary" href="${telHref(site.telephone)}">Appeler le cabinet · ${esc(site.telephone)}</a>`;
      box.innerHTML = crumbs + `<div class="res ${r.niveau}"><div class="niv">${labels[r.niveau] || ""}</div><h2>${esc(r.titre)}</h2><p>${esc(r.texte)}</p><div class="cta">${actions}${r.fiche ? `<a class="btn btn-ghost" href="conseils.html#${r.fiche}">Voir la fiche conseil</a>` : ""}</div></div>`;
    }
    const rs = box.querySelector("[data-restart]");
    if (rs) rs.onclick = e => { e.preventDefault(); path = []; show(t.depart); };
  };
  show(t.depart);
}

// --- FAQ
async function renderFaq(el) {
  const { items } = await load("faq");
  el.innerHTML = items.map(f => `<details class="faq"><summary>${esc(f.question)}</summary><div>${md(f.reponse)}</div></details>`).join("");
}

// --- Utilitaires
const fmtDate = d => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const isoDay = d => d.toISOString().slice(0, 10);
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 660; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6); o.start(); o.stop(a.currentTime + .6); } catch {} }
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// --- Mon suivi : rappels, Amsler, minuteurs
async function renderSuivi(site) {
  const cfg = await load("suivi");
  // Rappels
  const sel = $("#r-situation"), date = $("#r-date"), out = $("#r-out");
  sel.innerHTML = `<option value="">Choisissez…</option>` + cfg.rappels.map((r, i) => `<option value="${i}">${esc(r.situation)}</option>`).join("");
  const update = () => {
    const r = cfg.rappels[sel.value];
    if (!r) { out.hidden = true; return; }
    if (!date.dataset.touched) { const d = new Date(); d.setMonth(d.getMonth() + r.mois); date.value = isoDay(d); }
    const d = date.value.replace(/-/g, ""), title = r.texte + " · appeler le cabinet";
    const details = `Prendre rendez-vous au ${site.telephone} — ${site.adresse}, ${site.ville}`;
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}/${d}&details=${encodeURIComponent(details)}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//mesyeuxlignebleue//FR", "BEGIN:VEVENT", "UID:" + Date.now() + "@mesyeuxlignebleue.fr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""), "DTSTART;VALUE=DATE:" + d, "SUMMARY:" + title, "DESCRIPTION:" + details, "BEGIN:VALARM", "TRIGGER:PT9H", "ACTION:DISPLAY", "DESCRIPTION:" + title, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    out.hidden = false;
    out.innerHTML = `<p>Rappel le <strong>${fmtDate(new Date(date.value))}</strong> : « ${esc(r.texte)} ».</p><div class="cta"><a class="btn btn-primary" href="${gcal}">Ajouter à Google Agenda</a><a class="btn btn-ghost" href="${url}" download="rappel-ophtalmo.ics">Agenda iPhone / Outlook</a></div><p class="muted" style="font-size:.9rem">Délai indicatif : suivez toujours celui que le médecin vous a donné.</p>`;
  };
  sel.onchange = () => { delete date.dataset.touched; update(); };
  date.onchange = () => { date.dataset.touched = 1; update(); };

  // Amsler
  const last = store.get("amsler", null);
  const lastEl = $("#a-last");
  const showLast = d => lastEl.textContent = d ? `Dernier test : ${new Date(d).toLocaleDateString("fr-FR")}` : "";
  showLast(last);
  document.querySelectorAll("[data-amsler]").forEach(b => b.onclick = () => {
    const now = new Date().toISOString(); store.set("amsler", now); showLast(now);
    $("#a-res").innerHTML = b.dataset.amsler === "ok"
      ? `<div class="res conseil"><h3>Rien d'anormal</h3><p>Refaites le test une fois par semaine, chaque œil séparément.</p></div>`
      : `<div class="res urgent"><h3>Appelez le cabinet rapidement</h3><p>Des lignes déformées ou une zone manquante doivent être vérifiées sans tarder, surtout si c'est nouveau.</p><a class="btn btn-primary" href="${telHref(site.telephone)}">Appeler · ${esc(site.telephone)}</a></div>`;
  });

  // Minuteurs
  function timer(el, steps, loop) {
    let i = 0, left = 0, id = null;
    const disp = el.querySelector(".t-time"), lab = el.querySelector(".t-step"), btn = el.querySelector("button");
    const stop = () => { clearInterval(id); id = null; btn.textContent = "Démarrer"; lab.textContent = steps[0].label; disp.textContent = mmss(steps[0].sec); };
    const tick = () => {
      if (--left <= 0) {
        beep(); i++;
        if (i >= steps.length) { if (!loop) { stop(); lab.textContent = "Terminé, bravo !"; return; } i = 0; }
        left = steps[i].sec;
      }
      lab.textContent = steps[i].label; disp.textContent = mmss(left);
    };
    btn.onclick = () => { if (id) return stop(); i = 0; left = steps[0].sec + 1; btn.textContent = "Arrêter"; tick(); id = setInterval(tick, 1000); };
    stop();
  }
  timer($("#t-paupieres"), [{ label: "1. Chaleur sur les paupières fermées", sec: 300 }, { label: "2. Massage doux du bord des paupières", sec: 60 }, { label: "3. Nettoyage du bord des cils", sec: 60 }]);
  timer($("#t-ecran"), [{ label: "Travaillez normalement", sec: 1200 }, { label: "Regardez au loin (6 m) et clignez", sec: 20 }], true);
}

// --- Après mon opération
async function renderOperation(site) {
  const cfg = await load("suivi");
  $("#consignes").innerHTML = (cfg.postop_valide ? "" : `<span class="badge" style="margin:0 0 1rem">Brouillon à valider</span>`) + md(cfg.postop_consignes);
  $("#alertes").innerHTML = cfg.postop_alerte.map(a => `<li>${esc(a)}</li>`).join("");
  document.querySelectorAll(".tel-cab").forEach(a => { a.href = telHref(site.telephone); a.textContent = "Appeler le cabinet · " + site.telephone; });

  let data = store.get("postop", { date: "", drops: [], done: {} });
  const save = () => store.set("postop", data);
  const form = $("#op-form"), view = $("#op-view");
  const dropsEl = $("#op-drops");
  const drawForm = () => {
    $("#op-date").value = data.date;
    dropsEl.innerHTML = data.drops.map((d, i) => `<div class="drop-row"><input placeholder="Nom du collyre" value="${esc(d.nom)}" data-i="${i}" data-k="nom"><label><input type="number" min="1" max="12" value="${d.fois}" data-i="${i}" data-k="fois"> fois / jour</label><label>pendant <input type="number" min="1" max="120" value="${d.jours}" data-i="${i}" data-k="jours"> jours</label><button type="button" class="link" data-del="${i}">Retirer</button></div>`).join("") || `<p class="muted">Aucun collyre ajouté.</p>`;
  };
  dropsEl.addEventListener("input", e => { const { i, k } = e.target.dataset; if (i) { data.drops[i][k] = k === "nom" ? e.target.value : +e.target.value; save(); } });
  dropsEl.addEventListener("click", e => { if (e.target.dataset.del) { data.drops.splice(e.target.dataset.del, 1); save(); drawForm(); } });
  $("#op-add").onclick = () => { data.drops.push({ nom: "", fois: 4, jours: 30 }); save(); drawForm(); };
  $("#op-date").onchange = e => { data.date = e.target.value; save(); };
  form.onsubmit = e => { e.preventDefault(); if (!data.date || !data.drops.length) return; form.hidden = true; drawView(); };
  $("#op-edit").onclick = () => { form.hidden = false; view.hidden = true; drawForm(); };
  $("#op-reset").onclick = () => { if (view.dataset.confirm) { data = { date: "", drops: [], done: {} }; save(); delete view.dataset.confirm; $("#op-edit").click(); } else { view.dataset.confirm = 1; $("#op-reset").textContent = "Cliquez encore pour tout effacer"; } };

  let offset = 0;
  function drawView() {
    view.hidden = false;
    const op = new Date(data.date + "T00:00"), day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + offset);
    const n = Math.round((day - op) / 864e5), key = isoDay(new Date(day.getTime() + 12 * 36e5));
    const active = data.drops.map((d, i) => ({ ...d, i })).filter(d => n >= 0 && n < d.jours);
    const done = data.done[key] || {};
    $("#op-day").innerHTML = `${offset === 0 ? "Aujourd'hui, " : ""}${fmtDate(day)} <span class="muted">· ${n < 0 ? "avant l'opération" : n === 0 ? "jour de l'opération" : "jour " + n + " après l'opération"}</span>`;
    $("#op-list").innerHTML = active.length ? active.map(d => `<div class="drop-day"><strong>${esc(d.nom || "Collyre " + (d.i + 1))}</strong><span class="muted"> · jour ${n + 1} sur ${d.jours}</span><div class="ticks">${Array.from({ length: d.fois }, (_, k) => `<label class="tick"><input type="checkbox" data-d="${d.i}" data-k="${k}" ${done[d.i + "-" + k] ? "checked" : ""}><span>${k + 1}</span></label>`).join("")}</div></div>`).join("")
      : `<p class="muted">${n < 0 ? "Le traitement commence le jour de l'opération." : "Aucune goutte prévue ce jour-là. Traitement terminé !"}</p>`;
    const total = active.reduce((s, d) => s + d.fois, 0), nb = Object.values(done).filter(Boolean).length;
    $("#op-progress").textContent = total ? `${Math.min(nb, total)} / ${total} gouttes` : "";
    $("#op-list").onchange = e => { const t = e.target; data.done[key] = { ...(data.done[key] || {}), [t.dataset.d + "-" + t.dataset.k]: t.checked }; save(); drawView(); };
  }
  $("#op-prev").onclick = () => { offset--; drawView(); };
  $("#op-next").onclick = () => { offset++; drawView(); };
  $("#op-today").onclick = () => { offset = 0; drawView(); };

  if (data.date && data.drops.length) { form.hidden = true; drawView(); } else drawForm();
}

// --- Accueil : stations posées sur la ligne bleue
function placeStations() {
  const ridge = $("#ridge"), path = $("#ridge-path"), links = [...document.querySelectorAll("#stations a")];
  if (!path) return;
  const L = path.getTotalLength(), n = links.length;
  const place = () => {
    const vertical = matchMedia("(max-width:760px)").matches, R = ridge.getBoundingClientRect(), H = R.height, m = path.getScreenCTM();
    links.forEach((a, i) => {
      a.style.setProperty("--d", (0.9 + i * 0.15) + "s");
      a.classList.remove("up", "down");
      if (vertical || !m) return;
      const p = path.getPointAtLength(L * (i + 0.5) / n).matrixTransform(m), x = p.x - R.left, y = p.y - R.top, up = i % 2 === 0;
      a.classList.add(up ? "up" : "down");
      a.style.left = x + "px";
      const h = a.offsetHeight, top = up ? 6 : H - h - 22;
      a.style.top = top + "px";
      a.style.setProperty("--lead", Math.max(10, up ? y - top - h : top - y) + "px");
    });
  };
  place(); addEventListener("resize", place);
  requestAnimationFrame(() => ridge.classList.add("drawn"));
}
async function lastNews() {
  const el = $("#news-line"); if (!el) return;
  const { items } = await load("actualites");
  const n = items.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (n) el.innerHTML = `<span class="muted">Actualité · ${new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span> ${esc(n.titre)} →`;
  else el.remove();
}
