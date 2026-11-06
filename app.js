'use strict';

// ---------- Utilitaires ----------
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid);
  return el;
};
// Texte noir ou blanc selon la luminosité de la couleur du tier.
const textOn = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? '#14141f' : '#ffffff';
};
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2500);
}

// ---------- État + sauvegarde locale ----------
const STORE = 'tierlist-anime-v1';
const DEFAULT_TIERS = [
  ['S', '#ff7aa2', 'Chef-d’œuvre'], ['A', '#ffb83d', 'Excellent'], ['B', '#ffe066', 'Bien'], ['C', '#4ade9f', 'Moyen'], ['D', '#6ea0ff', 'Bof'],
];
const OLD_COLORS = { '#ff5d73': '#ff7aa2', '#ff9f43': '#ffb83d', '#ffd24d': '#ffe066', '#7bd88f': '#4ade9f', '#5fb0ff': '#6ea0ff' };

// Teinte plus sombre d'une couleur (pour le dégradé de la lettre).
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))).toString(16).padStart(2, '0');
  return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
};

const newList = (name) => ({
  id: uid(),
  name,
  tiers: DEFAULT_TIERS.map(([n, c, d]) => ({ id: uid(), name: n, color: c, desc: d, items: [] })),
  pool: [],
  items: {}, // clé -> { t: titre, i: image }
});

let db;
try { db = JSON.parse(localStorage.getItem(STORE)); } catch { db = null; }
if (!db || !Array.isArray(db.lists) || !db.lists.length) {
  const l = newList('Ma tier list');
  db = { v: 1, cur: l.id, lists: [l] };
}
// Mise à jour des anciennes listes : nouvelles couleurs par défaut et légendes (S, A, B, C, D).
for (const l of db.lists) {
  for (const t of l.tiers) {
    if (OLD_COLORS[t.color]) t.color = OLD_COLORS[t.color];
    if (t.desc === undefined) t.desc = (DEFAULT_TIERS.find((d) => d[0] === t.name) || [])[2] || '';
  }
}
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch { toast('Sauvegarde impossible (stockage plein ?)'); } };
const cur = () => db.lists.find((l) => l.id === db.cur) || db.lists[0];

// ---------- Affichage ----------
let sel = null; // clé de l'animé sélectionné
let sortables = [];
let imgBase = 'https://cdn.myanimelist.net/images/anime/';

const imgUrl = (i) => (i.startsWith('http') ? i : imgBase + i);

function card(list, key) {
  const it = list.items[key];
  return h('button', { class: 'card' + (key === sel ? ' sel' : ''), dataset: { k: key }, title: it.t, type: 'button' },
    h('img', { src: imgUrl(it.i), alt: it.t, loading: 'lazy', draggable: 'false' }),
    h('span', { class: 'tt' }, it.t));
}

function render() {
  const list = cur();
  const select = $('#listSelect');
  select.replaceChildren(...db.lists.map((l) => h('option', { value: l.id }, l.name)));
  select.value = list.id;

  sortables.forEach((s) => s.destroy());
  sortables = [];
  const board = $('#board');
  board.replaceChildren();

  // trait coloré continu sur le bord gauche : un seul dégradé de bas en haut des tiers
  const bar = `linear-gradient(180deg, ${list.tiers.map((t, i) => `${t.color} ${Math.round(((i + 0.5) / list.tiers.length) * 100)}%`).join(', ')})`;
  board.append(h('div', { class: 'tiers', style: `--bar:${bar}` }, list.tiers.map((t) =>
    h('div', { class: 'tier', style: `--c1:${t.color};--c2:${shade(t.color, -0.2)}` },
      h('button', { class: 'tier-label' + (t.name.length > 3 ? ' long' : ''), dataset: { tier: t.id }, type: 'button' },
        h('b', {}, t.name), t.desc ? h('small', {}, t.desc) : null),
      h('div', { class: 'zone', dataset: { zone: t.id } }, t.items.filter((k) => list.items[k]).map((k) => card(list, k))))),
    h('button', { class: 'add-tier', type: 'button' }, '＋ Ajouter un tier')));
  board.append(
    h('div', { class: 'cork' },
      h('div', { class: 'note' }, 'Non classé'),
      h('div', { class: 'zone', dataset: { zone: 'pool' } }, list.pool.filter((k) => list.items[k]).map((k) => card(list, k)))));

  board.querySelectorAll('.zone').forEach((z) => {
    sortables.push(new Sortable(z, {
      group: 'items',
      animation: 150,
      delay: 180,
      delayOnTouchOnly: true,
      touchStartThreshold: 6,
      ghostClass: 'sortable-ghost',
      onEnd: syncFromDom,
    }));
  });
  updatePlaceBar();
}

// Relit l'ordre depuis le DOM après un glisser-déposer.
function syncFromDom() {
  const list = cur();
  for (const z of document.querySelectorAll('.zone')) {
    const keys = [...z.children].map((c) => c.dataset.k);
    if (z.dataset.zone === 'pool') list.pool = keys;
    else list.tiers.find((t) => t.id === z.dataset.zone).items = keys;
  }
  save();
  render();
}

// ---------- Placement au toucher : toucher l'animé, puis le tier ----------
function updatePlaceBar() {
  const bar = $('#placeBar');
  const list = cur();
  if (!sel || !list.items[sel]) { sel = null; bar.hidden = true; return; }
  bar.hidden = false;
  bar.replaceChildren(
    h('div', { class: 'pt' }, 'Placer « ' + list.items[sel].t + ' » dans :'),
    h('div', { class: 'btns' },
      list.tiers.map((t) => h('button', { style: `background:${t.color};color:${textOn(t.color)}`, onclick: () => place(t.id), type: 'button' }, t.name)),
      h('button', { class: 'plain', onclick: () => place('pool'), type: 'button' }, 'Non classé'),
      h('button', { class: 'rm', onclick: removeSel, type: 'button' }, 'Retirer'),
      h('button', { class: 'plain', onclick: () => { sel = null; render(); }, type: 'button' }, 'Annuler')));
}

function detach(list, key) {
  list.pool = list.pool.filter((k) => k !== key);
  list.tiers.forEach((t) => (t.items = t.items.filter((k) => k !== key)));
}

function place(target) {
  const list = cur();
  detach(list, sel);
  (target === 'pool' ? list.pool : list.tiers.find((t) => t.id === target).items).push(sel);
  sel = null;
  save();
  render();
}

function removeSel() {
  const list = cur();
  detach(list, sel);
  delete list.items[sel];
  sel = null;
  save();
  render();
}

$('#board').addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) { sel = sel === c.dataset.k ? null : c.dataset.k; render(); return; }
  if (e.target.closest('.add-tier')) { openTier(null); return; }
  const lab = e.target.closest('.tier-label');
  if (lab) openTier(lab.dataset.tier);
});

// ---------- Tiers : fenêtre unique pour créer ou modifier (nom, légende, couleur parmi une palette) ----------
const SWATCHES = ['#ff7aa2', '#ff5d5d', '#ffb83d', '#ffe066', '#4ade9f', '#2dd4bf', '#6ea0ff', '#818cf8', '#b794f6', '#e879f9', '#9ca3af', '#f3f4f8'];
let editTier = null; // id du tier modifié, null = création
let draft = { name: '', desc: '', color: SWATCHES[0] };

function renderTierDialog() {
  const prev = $('#tierPrev');
  prev.style.cssText = `--c1:${draft.color};--c2:${shade(draft.color, -0.2)}`;
  $('b', prev).textContent = draft.name || '?';
  $('small', prev).textContent = draft.desc;
  const colors = SWATCHES.includes(draft.color) ? SWATCHES : [draft.color, ...SWATCHES];
  $('#swatches').replaceChildren(...colors.map((c) => h('button', {
    class: 'sw' + (c === draft.color ? ' on' : ''), style: `background:${c}`, type: 'button', 'aria-label': c,
    onclick: () => { draft.color = c; renderTierDialog(); },
  })));
}

function openTier(id) {
  const dlg = $('#dlgTier');
  editTier = id;
  if (id) {
    const t = cur().tiers.find((x) => x.id === id);
    draft = { name: t.name, desc: t.desc || '', color: t.color };
  } else {
    const used = new Set(cur().tiers.map((t) => t.color));
    draft = { name: '', desc: '', color: SWATCHES.find((c) => !used.has(c)) || SWATCHES[0] };
  }
  $('#tierTitle').textContent = id ? 'Modifier le tier' : 'Nouveau tier';
  $('#tierOk').textContent = id ? 'OK' : 'Ajouter';
  dlg.classList.toggle('is-new', !id);
  $('#tierName').value = draft.name;
  $('#tierDesc').value = draft.desc;
  renderTierDialog();
  dlg.returnValue = '';
  dlg.showModal();
  if (!id) $('#tierName').focus();
}

$('#tierName').addEventListener('input', (e) => { draft.name = e.target.value; renderTierDialog(); });
$('#tierDesc').addEventListener('input', (e) => { draft.desc = e.target.value; renderTierDialog(); });
// un nouveau tier doit avoir un nom
$('#tierOk').addEventListener('click', (e) => {
  if (!editTier && !draft.name.trim()) { e.preventDefault(); $('#tierName').focus(); }
});

function applyDraft() {
  const t = cur().tiers.find((x) => x.id === editTier);
  if (!t) return;
  t.name = draft.name.trim() || t.name;
  t.desc = draft.desc.trim();
  t.color = draft.color;
}
$('#dlgTier').addEventListener('close', () => {
  const ok = $('#dlgTier').returnValue === 'ok';
  if (editTier) applyDraft();
  else if (ok) cur().tiers.push({ id: uid(), name: draft.name.trim(), color: draft.color, desc: draft.desc.trim(), items: [] });
  save(); render();
});
function moveTier(d) {
  applyDraft();
  const ts = cur().tiers;
  const i = ts.findIndex((x) => x.id === editTier);
  const j = i + d;
  if (j < 0 || j >= ts.length) return;
  [ts[i], ts[j]] = [ts[j], ts[i]];
  save(); render();
}
$('#tierUp').onclick = () => moveTier(-1);
$('#tierDown').onclick = () => moveTier(1);
$('#tierDel').onclick = () => {
  const list = cur();
  const t = list.tiers.find((x) => x.id === editTier);
  if (t.items.length && !confirm(`Supprimer le tier « ${t.name} » ? Ses animés iront dans « Non classé ».`)) return;
  list.pool.push(...t.items);
  list.tiers = list.tiers.filter((x) => x.id !== editTier);
  editTier = null;
  $('#dlgTier').close();
};

// ---------- Plusieurs tier lists ----------
$('#listSelect').onchange = (e) => { db.cur = e.target.value; sel = null; save(); render(); };
$('#btnMenu').onclick = () => $('#dlgMenu').showModal();

$('#dlgMenu').addEventListener('click', (e) => {
  const act = e.target.dataset?.act;
  if (!act) return;
  const dlg = $('#dlgMenu');
  if (act === 'new') {
    const n = prompt('Nom de la nouvelle tier list :', 'Nouvelle tier list');
    if (n && n.trim()) { const l = newList(n.trim()); db.lists.push(l); db.cur = l.id; sel = null; save(); render(); dlg.close(); }
  } else if (act === 'rename') {
    const n = prompt('Nouveau nom :', cur().name);
    if (n && n.trim()) { cur().name = n.trim(); save(); render(); dlg.close(); }
  } else if (act === 'delete') {
    if (db.lists.length === 1) return toast('Il faut garder au moins une tier list');
    if (confirm(`Supprimer « ${cur().name} » ?`)) {
      db.lists = db.lists.filter((l) => l.id !== db.cur);
      db.cur = db.lists[0].id; sel = null; save(); render(); dlg.close();
    }
  } else if (act === 'about') {
    dlg.close();
    $('#aboutDate').textContent = animeData ? `Base mise à jour le ${animeData.lastUpdate}.` : '';
    $('#dlgAbout').showModal();
    loadData();
  }
});

// ---------- Recherche : base locale + AniList en complément ----------
let animeData = null;
let index = null;
let loading = null;

function loadData() {
  if (animeData) return Promise.resolve();
  loading ||= fetch('data/anime.json').then((r) => r.json()).then((d) => {
    animeData = d;
    imgBase = d.imgBase;
    // n : titre puis synonymes, normalisés ; h : tout concaténé pour le filtre rapide
    index = d.rows.map((r) => {
      const n = [r[0], ...r[6]].map((x) => ' ' + norm(x).replace(/^(l|le|la|les|the|un|une) /, '') + ' ');
      return { r, n, h: ' ' + norm(r[0] + ' ' + r[6].join(' ')) + ' ' };
    });
    render(); // les affiches stockées en chemin court ont maintenant leur base
  });
  return loading;
}

const rowKey = (r) => (r[4] ? 'a' + r[4] : 'm' + r[5]);

function searchLocal(q) {
  const nq = norm(q).replace(/^(l|le|la|les|the|un|une) /, '');
  if (!nq) return [];
  const toks = nq.split(' ');
  const out = [];
  for (const e of index) {
    if (!toks.every((t) => e.h.includes(t))) continue;
    const r = e.r;
    // meilleur score parmi le titre et les synonymes (synonymes un peu moins bien notés), les noms courts passent devant
    let s = 10;
    e.n.forEach((name, i) => {
      let v = 0;
      if (name === ' ' + nq + ' ') v = 100;
      else if (name.startsWith(' ' + nq)) v = 60;
      else if (name.includes(' ' + nq)) v = 40;
      else if (toks.every((t) => name.includes(t))) v = 25;
      if (v) v = v - (i ? 5 : 0) - Math.min(20, (name.length - nq.length) * 0.4);
      if (v > s) s = v;
    });
    s += [3, 2, 0, 0][r[1]] + r[7] / 10;
    out.push([s, r]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 40).map((x) => x[1]);
}

async function searchAniList(q) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: `query($s:String){Page(perPage:15){media(search:$s,type:ANIME,sort:SEARCH_MATCH){id idMal title{romaji english} format seasonYear coverImage{large}}}}`,
      variables: { s: q },
    }),
  });
  if (!res.ok) throw new Error(res.status);
  const j = await res.json();
  return j.data.Page.media.filter((m) => !['MUSIC', 'SPECIAL'].includes(m.format));
}

function addItem(key, title, image) {
  const list = cur();
  if (list.items[key]) return false;
  list.items[key] = { t: title, i: image };
  list.pool.push(key);
  save();
  render();
  return true;
}

function resRow(key, title, sub, image) {
  const added = !!cur().items[key];
  const b = h('button', { class: 'res' + (added ? ' added' : ''), type: 'button' },
    h('img', { src: imgUrl(image), alt: '', loading: 'lazy' }),
    h('div', { class: 'rt' }, h('b', {}, title), h('span', {}, sub)),
    h('div', { class: 'ck' }, added ? '✓' : '+'));
  b.onclick = () => {
    if (cur().items[key]) return toast('Déjà dans cette tier list');
    addItem(key, title, image);
    b.classList.add('added');
    b.querySelector('.ck').textContent = '✓';
    toast('Ajouté dans « Non classé »');
  };
  return b;
}

const rowSub = (r) => [animeData.types[r[1]], r[2] || null].filter(Boolean).join(' · ');
const FORMATS = { TV: 'TV', TV_SHORT: 'TV', MOVIE: 'MOVIE', OVA: 'OVA', ONA: 'ONA' };

async function doSearch() {
  const q = $('#q').value.trim();
  const box = $('#results');
  if (q.length < 2) { box.replaceChildren(h('div', { class: 'note' }, 'Tape au moins 2 lettres.')); return; }
  if (!animeData) {
    box.replaceChildren(h('div', { class: 'note' }, 'Chargement de la base…'));
    try { await loadData(); } catch { box.replaceChildren(h('div', { class: 'note' }, 'Base indisponible. Réessaie avec internet.')); return; }
  }
  const rows = searchLocal(q);
  const kids = rows.map((r) => resRow(rowKey(r), r[0], rowSub(r), r[3]));
  if (!rows.length) kids.push(h('div', { class: 'note' }, 'Rien dans la base.'));
  const more = h('button', { class: 'more ghost', type: 'button' }, 'Chercher aussi sur AniList (sorties récentes)');
  more.onclick = async () => {
    more.disabled = true;
    more.textContent = 'Recherche AniList…';
    try {
      const have = new Set(rows.flatMap((r) => [r[4] && 'a' + r[4], r[5] && 'm' + r[5]]));
      const media = (await searchAniList(q)).filter((m) => !have.has('a' + m.id) && !(m.idMal && have.has('m' + m.idMal)));
      more.replaceWith(...(media.length
        ? media.map((m) => resRow('a' + m.id, m.title.english || m.title.romaji, [FORMATS[m.format] || m.format, m.seasonYear].filter(Boolean).join(' · '), m.coverImage.large))
        : [h('div', { class: 'note' }, 'Rien de plus sur AniList.')]));
    } catch {
      more.disabled = false;
      more.textContent = 'AniList indisponible, réessayer';
    }
  };
  kids.push(more);
  box.replaceChildren(...kids);
  box.scrollTop = 0;
}

let debounce;
$('#q').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(doSearch, 200); });
$('#btnSearch').onclick = () => {
  $('#dlgSearch').showModal();
  $('#q').focus();
  if (!$('#q').value) doSearch();
  loadData().catch(() => {});
};
$('#dlgSearch').addEventListener('close', render);

// ---------- Démarrage ----------
render();
loadData().catch(() => {}); // précharge la base pour que les affiches et la recherche soient prêtes
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
