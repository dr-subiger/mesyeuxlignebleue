// Aperçu en direct dans l'admin : le panneau de droite affiche les contenus avec le style réel du site.
CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Public+Sans:wght@400;500;600;700&display=swap");
CMS.registerPreviewStyle("/style.css");
CMS.registerPreviewStyle(".preview-wrap{padding:28px 32px;background:#f7f5f0;min-height:100vh}.preview-label{font:600 11px/1 'Public Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#2350d6;margin:0 0 18px}", { raw: true });

const H = window.h, toJS = v => (v && v.toJS ? v.toJS() : v) || [];
const asset = (props, p) => (p ? String(props.getAsset(p) || p) : "");
const raw = html => H("div", { dangerouslySetInnerHTML: { __html: html } });
const wrap = (label, ...kids) => H("div", { className: "preview-wrap" }, H("p", { className: "preview-label" }, "Aperçu · " + label), ...kids);
const frDate = d => { try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; } };

CMS.registerPreviewTemplate("actualites", createClass({ render() {
  const items = toJS(this.props.entry.getIn(["data", "items"]));
  return wrap("page Actualités", H("h1", null, "Les nouvelles du cabinet"),
    H("div", { className: "news", style: { marginTop: "1.5rem" } }, items.map((n, i) => H("article", { key: i },
      H("time", null, frDate(n.date)),
      n.image ? H("img", { className: "news-img", src: asset(this.props, n.image) }) : null,
      H("h3", null, n.titre || "Titre de l'actualité"), raw(md(n.texte || ""))))));
}}));

CMS.registerPreviewTemplate("fiches", createClass({ render() {
  const items = toJS(this.props.entry.getIn(["data", "items"]));
  return wrap("fiches conseils", ...items.map((f, i) => H("article", { key: i, className: "panel", style: { marginBottom: "28px" } },
    H("div", { className: "kicker" }, f.theme || ""),
    H("h1", { style: { fontSize: "2rem" } }, f.titre || "Titre", f.valide ? null : H("span", { className: "badge" }, "Brouillon à valider")),
    H("p", { className: "muted", style: { fontSize: "1.1rem" } }, f.resume || ""),
    f.image ? H("img", { className: "fiche-img", src: asset(this.props, f.image) }) : null,
    raw(videoEmbed(f.video) + `<div class="prose">${md(f.contenu || "")}</div>`))));
}}));

CMS.registerPreviewTemplate("infos", createClass({ render() {
  const d = toJS(this.props.entry.get("data"));
  const rows = (d.horaires || []).map((h, i) => H("tr", { key: i }, H("td", null, h.jour), H("td", null, h.matin), H("td", null, h.apres_midi)));
  const sec = (t, ...k) => H("div", { style: { marginTop: "40px", paddingTop: "28px", borderTop: "1px dashed #c9d1dd" } }, H("p", { className: "preview-label" }, "Aperçu · " + t), ...k);
  return H("div", null,
    d.bandeau_actif && d.bandeau_texte ? H("div", { className: "bandeau" }, d.bandeau_texte) : null,
    wrap("horaires et rendez-vous",
      H("div", { className: "two" },
        H("div", { className: "panel" }, H("h2", null, "Horaires"), H("table", { className: "horaires" }, H("tbody", null, rows))),
        H("div", null, H("h2", null, "Prendre rendez-vous"), H("p", null, d.rdv_texte), H("p", { className: "tel-big" }, d.telephone),
          H("ul", { className: "check" }, (d.rdv_a_apporter || []).map((x, i) => H("li", { key: i }, x))),
          H("div", { className: "note" }, d.rdv_dilatation))),
      sec("page Venir au cabinet", H("div", { className: "acces-card" }, H("div", { className: "acces-ico", style: { background: "#e6f4ec", color: "#2f855a" } }, "♿"), H("div", null, H("h3", null, "Accès facilité"), H("p", null, d.acces_texte)))),
      sec("page Urgence",
        H("div", { className: "alert" }, H("h2", null, "Appelez le 15 immédiatement si :"), H("ul", { className: "check" }, (d.urgence_15 || []).map((x, i) => H("li", { key: i }, x)))),
        H("div", { className: "steps", style: { gridTemplateColumns: "1fr" } }, H("div", null, H("h3", null, "Le cabinet est fermé"), H("p", null, H("strong", null, d.urgence_hopital_nom), H("br"), d.urgence_hopital_adresse, H("br"), "Standard : " + (d.urgence_hopital_tel || "")))))));
}}));

CMS.registerPreviewTemplate("faq", createClass({ render() {
  const items = toJS(this.props.entry.getIn(["data", "items"]));
  return wrap("questions fréquentes", H("h1", null, "Vous vous demandez peut-être…"),
    ...items.map((q, i) => H("details", { key: i, className: "faq", open: true }, H("summary", null, q.question), raw(md(q.reponse || "")))));
}}));

CMS.registerPreviewTemplate("suivi", createClass({ render() {
  const d = toJS(this.props.entry.get("data"));
  return wrap("après mon opération", H("div", { className: "two" },
    H("div", null, H("h2", null, "Les bons gestes"), d.postop_valide ? null : H("span", { className: "badge" }, "Brouillon à valider"), raw(`<div class="prose">${md(d.postop_consignes || "")}</div>`)),
    H("div", { className: "alert" }, H("h2", null, "Appelez sans attendre si :"), H("ul", { className: "check" }, (d.postop_alerte || []).map((a, i) => H("li", { key: i }, a))))));
}}));

// Blocs à insérer dans les textes
CMS.registerEditorComponent({
  id: "encadre", label: "Encadré", fields: [{ name: "texte", label: "Texte de l'encadré", widget: "text" }],
  pattern: /^((?:> .*(?:\n|$))+)/, fromBlock: m => ({ texte: m[1].replace(/^> ?/gm, "").trim() }),
  toBlock: d => (d.texte || "").split("\n").map(l => "> " + l).join("\n"),
  toPreview: d => `<aside class="callout"><p>${esc(d.texte || "")}</p></aside>`
});
CMS.registerEditorComponent({
  id: "youtube", label: "Vidéo YouTube", fields: [{ name: "url", label: "Lien de la vidéo YouTube", widget: "string" }],
  pattern: /^(https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+)$/m, fromBlock: m => ({ url: m[1] }),
  toBlock: d => d.url || "", toPreview: d => videoEmbed(d.url) || "<p>Collez un lien YouTube</p>"
});
