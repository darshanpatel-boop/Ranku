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

const newList = (name, type = 'anime') => ({
  id: uid(),
  name,
  type,
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
let sortables = [];
let lastDrag = 0; // pour ne pas ouvrir la fiche juste après un glisser-déposer
let freshKey = null, freshTier = null; // pour animer ce qui vient d'être ajouté
let imgBase = 'https://cdn.myanimelist.net/images/anime/';

const imgUrl = (i) => (i.startsWith('http') || i.startsWith('data:') ? i : imgBase + i);

function card(list, key) {
  const it = list.items[key];
  return h('div', { class: 'card' + (key === freshKey ? ' pop' : ''), dataset: { k: key }, title: it.t },
    h('img', { src: imgUrl(it.i), alt: it.t, loading: 'lazy', draggable: 'false' }),
    it.m && it.m.length > 1 ? h('span', { class: 'cnt' }, '×' + it.m.length) : null,
    h('span', { class: 'tt' }, it.t));
}

function render() {
  const list = cur();
  renderTabs();

  sortables.forEach((s) => s.destroy());
  sortables = [];
  const board = $('#board');
  board.replaceChildren();

  // trait coloré continu sur le bord gauche : un seul dégradé de bas en haut des tiers
  const bar = `linear-gradient(180deg, ${list.tiers.map((t, i) => `${t.color} ${Math.round(((i + 0.5) / list.tiers.length) * 100)}%`).join(', ')})`;
  board.append(h('div', { class: 'board-tools' }, h('button', { class: 'share-btn', type: 'button' }, svgEl(SHARE_ICON), 'Partager')));
  board.append(h('div', { class: 'tiers', style: `--bar:${bar}` }, list.tiers.map((t, i) =>
    h('div', { class: 'tier' + (t.id === freshTier ? ' pop' : ''), dataset: { id: t.id }, style: `--i:${i};--c1:${t.color};--c2:${shade(t.color, -0.2)}` },
      h('div', { class: 'mv' },
        h('button', { dataset: { mv: '-1', tier: t.id }, 'aria-label': 'Monter ce tier', type: 'button', ...(i === 0 ? { disabled: '' } : {}) }, '▲'),
        h('button', { dataset: { mv: '1', tier: t.id }, 'aria-label': 'Descendre ce tier', type: 'button', ...(i === list.tiers.length - 1 ? { disabled: '' } : {}) }, '▼')),
      h('button', { class: 'tier-label' + (t.name.length > 3 ? ' long' : ''), dataset: { tier: t.id }, type: 'button' },
        h('b', {}, t.name), t.desc ? h('small', {}, t.desc) : null),
      h('div', { class: 'zone', dataset: { zone: t.id } }, t.items.filter((k) => list.items[k]).map((k) => card(list, k))))),
    h('button', { class: 'add-tier', type: 'button' }, '＋ Ajouter un tier')));
  board.append(
    h('button', { class: 'add-anime', type: 'button' }, svgEl('<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'), h('span', { class: 'aa-t' }, list.type === 'char' ? 'Rechercher un personnage à ajouter…' : 'Rechercher un animé à ajouter…'), h('kbd', {}, '/'), h('span', { class: 'aa-b' }, 'Ajouter')),
    h('div', { class: 'import-row' }, list.type === 'char'
      ? h('button', { class: 'import-btn chars-btn', type: 'button' }, svgEl(IMPORT_ICON), 'Ajouter les personnages principaux de mes animés')
      : h('button', { class: 'import-btn', type: 'button' }, svgEl(IMPORT_ICON), 'Importer ma liste AniList')),
    h('div', { class: 'cork' },
      h('div', { class: 'note' }, 'Non classé', h('b', { class: 'cnt-n' }, String(list.pool.filter((k) => list.items[k]).length))),
      h('div', { class: 'zone', dataset: { zone: 'pool' } }, list.pool.filter((k) => list.items[k]).map((k) => card(list, k)))));

  freshKey = null; freshTier = null;
  board.querySelectorAll('.zone').forEach((z) => {
    sortables.push(new Sortable(z, {
      group: 'items',
      animation: 160,
      forceFallback: true,       // glisser géré par Sortable lui-même (même comportement partout, souris et doigt)
      fallbackOnBody: true,      // la copie qui suit le curseur passe au-dessus de tout (barre du haut comprise)
      fallbackTolerance: 3,
      delay: 160,                // au doigt : appui bref avant de saisir, pour pouvoir faire défiler la page
      delayOnTouchOnly: true,
      touchStartThreshold: 6,
      emptyInsertThreshold: 30,  // facilite le dépôt dans un tier vide
      swapThreshold: 0.6,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: () => { lastDrag = Date.now(); syncFromDom(); },
    }));
  });
  updateBar();
}

// Relit l'ordre depuis le DOM après un glisser-déposer (le DOM est déjà à jour : pas de reconstruction).
function syncFromDom() {
  const list = cur();
  for (const z of document.querySelectorAll('#board .zone')) {
    const keys = [...z.children].map((c) => c.dataset.k).filter(Boolean);
    if (z.dataset.zone === 'pool') list.pool = keys;
    else list.tiers.find((t) => t.id === z.dataset.zone).items = keys;
  }
  save();
  updateBar();
  const cn = $('.cork .note .cnt-n');
  if (cn) cn.textContent = String(list.pool.filter((k) => list.items[k]).length);
}

function detach(list, key) {
  list.pool = list.pool.filter((k) => k !== key);
  list.tiers.forEach((t) => (t.items = t.items.filter((k) => k !== key)));
}

$('#board').addEventListener('click', (e) => {
  if (e.target.closest('.share-btn')) { openShare(); return; }
  if (e.target.closest('.chars-btn')) { openChars(); return; }
  if (e.target.closest('.import-btn')) { openImport(); return; }
  const card = e.target.closest('.card');
  if (card && Date.now() - lastDrag > 300) { openFiche(card.dataset.k); return; }
  const mv = e.target.closest('[data-mv]');
  if (mv) { swapTier(mv.dataset.tier, Number(mv.dataset.mv)); return; }
  if (e.target.closest('.add-anime')) { openSearch(); return; }
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
// Validation (bouton OK ou touche Entrée) : crée ou met à jour le tier tout de suite.
$('#formTier').addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'ok') return;
  if (editTier) applyDraft();
  else { freshTier = uid(); cur().tiers.push({ id: freshTier, name: draft.name.trim(), color: draft.color, desc: draft.desc.trim(), items: [] }); }
  save(); render();
});
// Fermeture autrement (Échap, clic à côté) : en modification, les changements déjà faits sont gardés.
$('#dlgTier').addEventListener('close', () => { if (editTier) { applyDraft(); save(); render(); } });
function moveTier(d) {
  applyDraft();
  swapTier(editTier, d);
}
function swapTier(id, d) {
  const before = new Map([...document.querySelectorAll('#board .tier')].map((e) => [e.dataset.id, e.getBoundingClientRect().top]));
  const ts = cur().tiers;
  const i = ts.findIndex((x) => x.id === id);
  const j = i + d;
  if (j < 0 || j >= ts.length) return;
  [ts[i], ts[j]] = [ts[j], ts[i]];
  save(); render();
  // les deux tiers glissent vers leur nouvelle place
  document.querySelectorAll('#board .tier').forEach((e) => {
    const dy = (before.get(e.dataset.id) ?? 0) - e.getBoundingClientRect().top;
    if (dy) e.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
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

// ---------- Plusieurs tier lists : onglets en haut, plus de menu caché ----------
// Le fond bleu de l'onglet actif est un élément à part qui reste en place : quand l'onglet change, il glisse.
const PENCIL = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
const tabPill = h('span', { class: 'tab-pill' });
function placePill(animate = true) {
  const on = $('#listTabs .chip.on');
  if (!on) { tabPill.style.opacity = 0; return; }
  tabPill.classList.toggle('ready', animate && tabPill.dataset.placed === '1');
  Object.assign(tabPill.style, { left: on.offsetLeft + 'px', top: on.offsetTop + 'px', width: on.offsetWidth + 'px', height: on.offsetHeight + 'px', opacity: 1 });
  tabPill.dataset.placed = '1';
}
window.addEventListener('resize', () => placePill(false));
document.fonts?.ready.then(() => placePill(false));

function renderTabs() {
  const box = $('#listTabs');
  box.replaceChildren(
    tabPill,
    ...db.lists.map((l) => {
      const on = l.id === db.cur;
      return h('button', { class: 'chip' + (on ? ' on' : ''), dataset: { list: l.id }, type: 'button', title: on ? 'Renommer ou supprimer cette liste' : null },
        l.type === 'char' ? h('span', { class: 'ty' }, svgEl(USER_ICON)) : null, l.name, on ? h('span', { class: 'ed' }, svgEl(PENCIL)) : null);
    }));
  $('.chip.on', box)?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  placePill();
}

let editList = null; // id de la liste modifiée, null = création
let delArmed = false;
function openList(id) {
  const dlg = $('#dlgList');
  editList = id;
  delArmed = false;
  $('#listDel').textContent = 'Supprimer';
  $('#listTitle').textContent = id ? 'Modifier la liste' : 'Nouvelle tier list';
  $('#listOk').textContent = id ? 'OK' : 'Créer';
  $('#listName').value = id ? db.lists.find((l) => l.id === id).name : '';
  dlg.classList.toggle('is-new', !id);
  listType = 'anime'; renderListType();
  dlg.returnValue = '';
  dlg.showModal();
  $('#listName').focus();
}
$('#listOk').addEventListener('click', (e) => { if (!$('#listName').value.trim()) { e.preventDefault(); $('#listName').focus(); } });
$('#dlgList form').addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'ok') return;
  const name = $('#listName').value.trim();
  if (!name) return;
  if (editList) db.lists.find((l) => l.id === editList).name = name;
  else { const l = newList(name, listType); db.lists.push(l); db.cur = l.id; }
  save(); render();
});
$('#listDel').onclick = () => {
  if (db.lists.length === 1) return toast('Il faut garder au moins une tier list');
  if (!delArmed) { delArmed = true; $('#listDel').textContent = 'Sûr ? Appuie pour supprimer'; return; }
  db.lists = db.lists.filter((l) => l.id !== editList);
  if (db.cur === editList) db.cur = db.lists[0].id;
  editList = null;
  $('#dlgList').close('deleted');
  save(); render();
};
// Un clic sur un onglet change de liste ; un clic sur l'onglet déjà actif ouvre son renommage / sa suppression.
$('#listTabs').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-list]');
  if (!chip) return;
  if (chip.dataset.list === db.cur) { openList(db.cur); return; }
  db.cur = chip.dataset.list; save(); render();
  $('#board').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
});
$('#btnNewList').onclick = () => openList(null);

$('#btnAbout').onclick = () => {
  $('#aboutDate').textContent = animeData ? `Base mise à jour le ${animeData.lastUpdate}.` : '';
  $('#dlgAbout').showModal();
  loadData();
};

// ---------- Recherche : base locale + AniList en complément ----------
let animeData = null;
let index = null;
let loading = null;
let rowByAnilist = new Map(), rowByMal = new Map(); // idAniList / idMAL -> indice de ligne
let rowByKey = new Map(); // clé (a<idAniList> / m<idMAL>) -> indice de ligne dans la base

function loadData() {
  if (animeData) return Promise.resolve();
  loading ||= fetch('data/anime.json').then((r) => r.json()).then((d) => {
    animeData = d;
    imgBase = d.imgBase;
    rowByKey = new Map(d.rows.map((r, i) => [rowKey(r), i]));
    d.rows.forEach((r, i) => { if (r[4]) rowByAnilist.set(r[4], i); if (r[5]) rowByMal.set(r[5], i); });
    // n : titre puis synonymes, normalisés ; h : tout concaténé pour le filtre rapide
    index = d.rows.map((r) => {
      const n = [r[0], ...r[6]].map((x) => ' ' + norm(x).replace(/^(l|le|la|les|the|un|une) /, '') + ' ');
      return { r, n, h: ' ' + norm(r[0] + ' ' + r[6].join(' ')) + ' ' };
    });
  });
  return loading;
}

const rowKey = (r) => (r[4] ? 'a' + r[4] : 'm' + r[5]);
const rowOfKey = (k) => { const i = rowByKey.get(k); return i === undefined ? null : animeData.rows[i]; };
const gidOf = (k) => rowOfKey(k)?.[8] || 0;                                   // licence d'un animé (0 = seul)
const groupRows = (gid) => (animeData.groups[gid] || []).map((i) => animeData.rows[i]); // le premier = jaquette
const fmtOf = (r) => animeData.types[r[1]];
// clé de la carte de cette licence dans la liste (la clé peut changer si la jaquette de la base change : on cherche par contenu)
const groupItemKey = (list, gid) => (gid && animeData ? Object.keys(list.items).find((k) => list.items[k].m && gidOf(list.items[k].m[0]) === gid) || null : null);

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

function addItem(key, title, image, m, extra) {
  const list = cur();
  if (list.items[key]) return false;
  list.items[key] = m ? { t: title, i: image, m } : { t: title, i: image };
  if (extra) Object.assign(list.items[key], extra);
  list.pool.push(key);
  freshKey = key;
  save();
  render();
  return true;
}

// ---------- Fenêtre « Ajouter des animés » ----------
const TYPE_FR = { TV: 'Série', MOVIE: 'Film', OVA: 'OVA', ONA: 'ONA' };
const FORMATS = { TV: 'TV', TV_SHORT: 'TV', MOVIE: 'MOVIE', OVA: 'OVA', ONA: 'ONA' };
const PILLS = [['all', 'Tous'], ['TV', 'Séries'], ['MOVIE', 'Films'], ['OVA', 'OVA / ONA']];
const S = { items: [], ani: [], ids: new Set(), byKey: new Map(), type: 'all', hide: false, session: new Set(), aniState: '', undoKey: null };
let toastSearchTimer;

const itemFromRow = (r) => {
  const gid = r[8];
  if (gid) {
    const g = groupRows(gid), rep = g[0];
    return { key: 'g' + rowKey(rep), gid, n: g.length, title: rep[0], img: rep[3], fmt: fmtOf(rep), year: rep[2] || '' };
  }
  return { key: rowKey(r), title: r[0], img: r[3], fmt: fmtOf(r), year: r[2] || '' };
};
const itemFromAni = (m) => {
  const f = FORMATS[m.format] || 'TV';
  return { key: 'a' + m.id, title: m.title.english || m.title.romaji, img: m.coverImage.large, fmt: f, year: m.seasonYear || '' };
};
const keyInList = (it) => (it.gid ? groupItemKey(cur(), it.gid) : (cur().items[it.key] ? it.key : null));
const isAdded = (it) => !!keyInList(it);
const inPill = (it, k) => k === 'all' || it.fmt === k || (k === 'OVA' && it.fmt === 'ONA');

// Titre avec les lettres tapées surlignées (sans accents ni majuscules).
const fold = (s) => [...s].map((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).join('');
function hlNodes(title, q) {
  const f = fold(title), qq = fold(q.trim()), i = qq ? f.indexOf(qq) : -1;
  if (i < 0 || f.length !== title.length) return [title];
  return [title.slice(0, i), h('mark', {}, title.slice(i, i + qq.length)), title.slice(i + qq.length)];
}

const svgEl = (html, cls) => { const t = document.createElement('template'); t.innerHTML = html.trim(); const el = t.content.firstChild; if (cls) el.classList.add(cls); return el; };
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TRASH = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';

function srChip(added) {
  return h('button', { class: 'sr-chip' + (added ? ' ad' : ''), type: 'button', 'aria-label': added ? 'Retirer de ma liste' : 'Ajouter à ma liste' },
    added
      ? [h('i', { class: 'ic' }, svgEl(CHECK, 'i-ck'), svgEl(TRASH, 'i-tr')), h('span', { class: 'lbl' }, h('span', {}, 'Retirer'))]
      : [h('i', { class: 'ic' }, '+'), 'Ajouter']);
}

function srItem(it, q, n = 0) {
  const added = isAdded(it);
  return h('div', { class: 'sr-it' + (added ? ' added' : '') + (it.gid ? ' stack' : ''), dataset: { k: it.key }, style: `--n:${Math.min(n, 14)}` },
    h('div', { class: 'sr-pic' }, h('img', { src: imgUrl(it.img), alt: '', loading: 'lazy' }), h('div', { class: 'sr-ov' }, srChip(added))),
    h('b', {}, hlNodes(it.title, q)),
    h('span', { class: 'sr-meta' }, it.char ? null : h('span', { class: 'sr-tag t-' + it.fmt }, TYPE_FR[it.fmt] || it.fmt), it.char ? it.sub : it.gid ? ` ${it.n} saisons` : (it.year ? ' ' + it.year : '')));
}

function renderSearch(animate) {
  const dlg = $('#dlgSearch'), grid = $('#results');
  const qv = $('#q').value, q = qv.trim(), list = cur();
  const top = grid.scrollTop;
  grid.classList.toggle('fresh', !!animate);
  dlg.classList.toggle('has-q', !!qv);
  const all = [...S.items, ...S.ani];
  S.byKey = new Map(all.map((it) => [it.key, it]));

  $('#srTools').replaceChildren(
    ...(list.type === 'char' ? [] : PILLS).map(([k, n]) => h('button', { class: 'sw-pill' + (S.type === k ? ' on' : ''), dataset: { ty: k }, type: 'button' },
      n, q.length >= 2 ? h('small', {}, String(all.filter((it) => inPill(it, k)).length)) : null)),
    h('span', { class: 'sw-tog' + (S.hide ? ' on' : ''), id: 'srTog' }, h('i'), 'Masquer ceux déjà ajoutés'));

  const visible = (arr) => arr.filter((it) => inPill(it, S.type) && !(S.hide && isAdded(it)));
  const loc = visible(S.items), ani = visible(S.ani);
  const aniLabel = { '': 'Pas trouvé ? Chercher aussi sur AniList', loading: 'Recherche sur AniList…', done: S.ani.length ? `AniList : ${S.ani.length} résultat${S.ani.length > 1 ? 's' : ''} en plus` : 'Rien de plus sur AniList', error: 'AniList indisponible — réessayer' }[S.aniState];

  if (q.length < 2) {
    grid.replaceChildren(h('div', { class: 'sw-hint' },
      h('div', { class: 'big' }, '🔎'), h('p', {}, list.type === 'char' ? 'Tape le nom d’un personnage' : 'Tape le titre d’un animé'),
      h('small', {}, list.type === 'char' ? 'Tous les personnages d’AniList, méchants compris. Essaie le nom tel qu’il s’écrit en romaji : « Gojo », « Luffy », « Eren »…' : 'En français, en anglais ou en japonais : « L’Attaque des Titans » et « Shingeki no Kyojin » marchent tous les deux.')));
    $('#srCnt').textContent = '';
  } else if (!loc.length && !ani.length) {
    grid.replaceChildren(h('div', { class: 'sw-hint' },
      h('div', { class: 'big' }, '🤔'), h('p', {}, `Rien dans la base pour « ${q} ».`),
      h('small', {}, list.type === 'char' ? 'Essaie une autre orthographe (le nom en romaji).' : 'Les sorties très récentes ne sont pas toujours dedans.'),
      list.type !== 'char' && (S.aniState === '' || S.aniState === 'error') ? h('button', { class: 'sw-go', id: 'srAni2', type: 'button' }, 'Chercher sur AniList') : null));
    $('#srCnt').textContent = '';
  } else {
    grid.replaceChildren(...loc.map((it, i) => srItem(it, q, i)),
      ani.length ? h('div', { class: 'sw-sep' }, 'Sur AniList') : null, ...ani.map((it, i) => srItem(it, q, i)));
    $('#srCnt').textContent = `${loc.length + ani.length} résultat${loc.length + ani.length > 1 ? 's' : ''}`;
  }
  grid.scrollTop = top;

  const link = $('#srAni');
  link.hidden = q.length < 2 || list.type === 'char';
  link.textContent = aniLabel;
  $('#srCount').textContent = S.session.size ? `${S.session.size} ajouté${S.session.size > 1 ? 's' : ''}` : '';
}

async function doSearch() {
  const q = $('#q').value.trim();
  S.ani = []; S.aniState = '';
  if (q.length < 2) { S.items = []; renderSearch(true); return; }
  if (cur().type === 'char') { doCharSearch(q); return; }
  if (!animeData) {
    try { await loadData(); } catch { $('#results').replaceChildren(h('div', { class: 'sw-hint' }, h('p', {}, 'Base indisponible. Réessaie avec internet.'))); return; }
  }
  const rows = searchLocal(q);
  S.items = [...new Map(rows.map(itemFromRow).map((it) => [it.key, it])).values()]; // une seule carte par licence
  S.ids = new Set(rows.flatMap((r) => [r[4] && 'a' + r[4], r[5] && 'm' + r[5]]).filter(Boolean));
  renderSearch(true);
}

async function fetchAni() {
  const q = $('#q').value.trim();
  if (q.length < 2 || S.aniState === 'loading') return;
  S.aniState = 'loading'; renderSearch();
  try {
    const media = (await searchAniList(q)).filter((m) => !S.ids.has('a' + m.id) && !(m.idMal && S.ids.has('m' + m.idMal)));
    S.ani = media.map(itemFromAni); S.aniState = 'done';
  } catch { S.aniState = 'error'; }
  renderSearch();
}

function removeKey(key) {
  const list = cur();
  detach(list, key);
  delete list.items[key];
  S.session.delete(key);
  save(); render();
}

function showUndo(it) {
  const t = $('#srToast');
  S.undoKey = it.key;
  t.replaceChildren(h('span', {}, `« ${it.title} » ajouté dans Non classé`), h('button', { id: 'srUndo', type: 'button' }, 'Annuler'));
  t.classList.add('show');
  clearTimeout(toastSearchTimer);
  toastSearchTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function updateMeta() {
  const n = $('#results').querySelectorAll('.sr-it:not(.leaving)').length;
  if ($('#q').value.trim().length >= 2) {
    if (!n) { renderSearch(); return; }
    $('#srCnt').textContent = `${n} résultat${n > 1 ? 's' : ''}`;
  }
  $('#srCount').textContent = S.session.size ? `${S.session.size} ajouté${S.session.size > 1 ? 's' : ''}` : '';
}

function refreshItem(it, added) {
  const el = $(`.sr-it[data-k="${CSS.escape(it.key)}"]`);
  if (el) {
    el.classList.toggle('added', added);
    el.querySelector('.sr-ov').replaceChildren(srChip(added));
    if (added) el.querySelector('.sr-chip').classList.add('just', 'pop'); // pas de « Retirer » tant que la souris reste sur le bouton
    if (added && S.hide) { el.classList.add('leaving'); setTimeout(() => { el.remove(); updateMeta(); }, 260); }
  }
  updateMeta();
}

function toggleItem(it) {
  const k = keyInList(it);
  if (k) { removeKey(k); S.session.delete(it.key); }
  else { addItem(it.key, it.title, it.img, it.gid ? groupRows(it.gid).map(rowKey) : undefined, it.char ? { a: it.sub } : undefined); S.session.add(it.key); showUndo(it); }
  refreshItem(it, !!keyInList(it));
}

$('#results').addEventListener('click', (e) => {
  if (e.target.closest('#srAni2')) { fetchAni(); return; }
  const chip = e.target.closest('.sr-chip');
  if (!chip) return;
  const it = S.byKey.get(chip.closest('.sr-it').dataset.k);
  if (it) toggleItem(it);
});
$('#results').addEventListener('mouseout', (e) => {
  const c = e.target.closest('.sr-chip');
  if (c && !c.contains(e.relatedTarget)) c.classList.remove('just');
});
$('#srTools').addEventListener('click', (e) => {
  const p = e.target.closest('[data-ty]');
  if (p) { S.type = p.dataset.ty; renderSearch(); return; }
  if (e.target.closest('#srTog')) { S.hide = !S.hide; renderSearch(); }
});
$('#srAni').onclick = fetchAni;
$('#srToast').addEventListener('click', (e) => {
  if (e.target.id !== 'srUndo' || !S.undoKey) return;
  removeKey(S.undoKey); S.undoKey = null;
  $('#srToast').classList.remove('show');
  renderSearch();
});

let debounce;
$('#q').addEventListener('input', () => {
  $('#dlgSearch').classList.toggle('has-q', !!$('#q').value);
  clearTimeout(debounce);
  debounce = setTimeout(doSearch, 150);
});
$('#srClr').onclick = () => { $('#q').value = ''; $('#q').focus(); doSearch(); };
$('#srClose').onclick = () => $('#dlgSearch').close();
$('#srDone').onclick = () => $('#dlgSearch').close();
$('#dlgSearch').addEventListener('click', (e) => { if (e.target === $('#dlgSearch')) $('#dlgSearch').close(); });

function openSearch() {
  const dlg = $('#dlgSearch');
  const chr = cur().type === 'char';
  $('#srTitle').textContent = chr ? 'Ajouter des personnages' : 'Ajouter des animés';
  $('#q').placeholder = chr ? 'Nom d’un personnage…' : 'Titre d’un animé…';
  if (!dlg.open) dlg.showModal();
  $('#q').focus();
  renderSearch();
  loadData().then(() => { if ($('#q').value.trim()) doSearch(); }).catch(() => {});
}
// La touche « / » ouvre la recherche (ou y replace le curseur), comme sur beaucoup de sites.
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea, select')) return;
  e.preventDefault();
  openSearch();
});
$('#dlgSearch').addEventListener('close', () => {
  $('#q').value = '';
  Object.assign(S, { items: [], ani: [], aniState: '', undoKey: null, type: 'all' });
  S.session.clear();
  $('#srToast').classList.remove('show');
  render();
});

// ---------- Fiche d'une carte : saisons vues, jaquette, séparer / regrouper, retirer ----------
let ficheKey = null;

const rekey = (list, from, to) => {
  list.pool = list.pool.map((k) => (k === from ? to : k));
  list.tiers.forEach((t) => (t.items = t.items.map((k) => (k === from ? to : k))));
};
// place `key` juste après `after` dans le tier (ou le liège) qui contient `after`
function insertAfter(list, after, key) {
  const box = list.tiers.map((t) => t.items).concat([list.pool]).find((a) => a.includes(after)) || list.pool;
  box.splice(box.indexOf(after) + 1, 0, key);
}

async function openFiche(key) {
  if (!animeData) { try { await loadData(); } catch { /* hors ligne : la fiche s'affiche sans les saisons */ } }
  ficheKey = key;
  renderFiche();
  if (!$('#dlgFiche').open && ficheKey) $('#dlgFiche').showModal();
}

function fiAction(label, act, k, cls = '') {
  return h('button', { class: 'fi-a ' + cls, type: 'button', dataset: { fa: act, k }, title: label }, label);
}

const fiMember = (r, { off }) => {
  const f = fmtOf(r);
  return h('div', { class: 'fi-m' + (off ? ' off' : '') },
    h('span', { class: 'sr-tag t-' + f }, TYPE_FR[f]), h('span', { class: 't' }, r[0]), h('em', {}, r[2] || ''));
};

function renderFiche() {
  const list = cur(), it = list.items[ficheKey];
  if (!it) { ficheKey = null; if ($('#dlgFiche').open) $('#dlgFiche').close(); return; }
  $('#fiImg').src = imgUrl(it.i);
  $('#fiTitle').textContent = it.t;
  $('#fiReset').hidden = it.i0 === undefined;
  const box = $('#fiList');
  const gid = it.m ? gidOf(it.m[0]) : gidOf(ficheKey);
  const rows = animeData && gid ? groupRows(gid) : [];

  if (it.m && rows.length) {
    $('#fiSub').textContent = `${rows.length} saison${rows.length > 1 ? 's' : ''}`;
    box.replaceChildren(
      h('p', { class: 'fi-hint' }, 'L’étoile choisit la jaquette de la carte. « Séparer » fait d’une saison une carte à part.'),
      ...rows.map((r) => {
        const k = rowKey(r), on = it.m.includes(k), apart = !!list.items[k] && k !== ficheKey && !on;
        return h('div', { class: 'fi-row' },
          fiMember(r, { off: !on }),
          on ? fiAction(r[3] === it.i ? '★' : '☆', 'cover', k, r[3] === it.i ? 'on' : '') : null,
          on && it.m.length > 1 ? fiAction('Séparer', 'split', k) : null,
          apart ? fiAction('Regrouper', 'merge', k) : null,
          !on && !apart ? fiAction('Ajouter', 'toggle', k) : null);
      }));
  } else {
    const r = rowOfKey(ficheKey);
    $('#fiSub').textContent = r ? [TYPE_FR[fmtOf(r)], r[2] || null].filter(Boolean).join(' · ') : (it.a || '');
    box.replaceChildren(
      rows.length > 1
        ? h('div', { class: 'fi-solo' }, h('p', {}, `Cette carte est séparée de sa licence (${rows.length} saisons).`), h('button', { class: 'ghost', id: 'fiRegroup', type: 'button' }, 'Regrouper avec sa licence'))
        : h('p', { class: 'fi-hint' }, it.a !== undefined ? 'Personnage' + (it.a ? ' de « ' + it.a + ' »' : '') + '.' : 'Aucune autre saison liée à cet animé dans la base.'));
  }
}

function fiAct(act, k) {
  const list = cur(), it = list.items[ficheKey], r = rowOfKey(k);
  if (act === 'toggle') {
    if (!it.m.includes(k)) it.m.push(k);
  } else if (act === 'cover') {
    it.i = r[3]; delete it.i0;
  } else if (act === 'split') {
    it.m = it.m.filter((x) => x !== k);
    list.items[k] = { t: r[0], i: r[3] };
    insertAfter(list, ficheKey, k);
    freshKey = k;
  } else if (act === 'merge') {
    detach(list, k); delete list.items[k];
    it.m.push(k);
  }
  save(); render(); renderFiche();
}

function regroupSolo() {
  const list = cur(), gid = gidOf(ficheKey);
  const target = groupItemKey(list, gid);
  if (target) { // la carte de la licence existe déjà : on y ajoute celle-ci
    list.items[target].m.push(ficheKey);
    detach(list, ficheKey); delete list.items[ficheKey];
    ficheKey = target;
  } else { // sinon cette carte devient la carte de la licence
    const rep = groupRows(gid)[0], nk = 'g' + rowKey(rep), old = list.items[ficheKey];
    list.items[nk] = { t: rep[0], i: old.i, m: [ficheKey] };
    rekey(list, ficheKey, nk);
    delete list.items[ficheKey];
    ficheKey = nk;
  }
  save(); render(); renderFiche();
}

$('#fiList').addEventListener('click', (e) => {
  const a = e.target.closest('[data-fa]');
  if (a) { fiAct(a.dataset.fa, a.dataset.k); return; }
  if (e.target.closest('#fiRegroup')) regroupSolo();
});
$('#fiDel').onclick = () => { const k = ficheKey; $('#dlgFiche').close(); removeKey(k); };
$('#fiOk').onclick = () => $('#dlgFiche').close();
$('#fiClose').onclick = () => $('#dlgFiche').close();
$('#dlgFiche').addEventListener('click', (e) => { if (e.target === $('#dlgFiche')) $('#dlgFiche').close(); });
$('#dlgFiche').addEventListener('close', () => { ficheKey = null; });

// ---------- Partager : image de la tier list (aperçu, télécharger, copier, partage natif) ----------
const SHARE_ICON = '<svg viewBox="0 0 24 24"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
const SH = { blob: null, busy: 0 };

const loadImage = (url) => new Promise((resolve) => {
  const im = new Image();
  im.crossOrigin = 'anonymous'; // les sites d'affiches autorisent l'usage dans un canvas
  const t = setTimeout(() => resolve(null), 9000);
  im.onload = () => { clearTimeout(t); resolve(im); };
  im.onerror = () => { clearTimeout(t); resolve(null); };
  im.src = url;
});

function rr(ctx, x, y, w, h, r) { // rectangle arrondi (compatible partout)
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPoster(ctx, im, title, x, y, w, h) {
  const R = 12;
  rr(ctx, x, y + 3, w, h, R); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(); // relief sous l'affiche, comme sur la page
  ctx.save();
  rr(ctx, x, y, w, h, R); ctx.clip();
  if (im) { // recadrage « cover »
    const k = Math.max(w / im.width, h / im.height), sw = w / k, sh = h / k;
    ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = '#3a3f50'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c9cde0'; ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
    title.split(' ').slice(0, 6).forEach((word, i) => ctx.fillText(word, x + w / 2, y + 30 + i * 16));
  }
  ctx.restore();
  rr(ctx, x + 1, y + 1, w - 2, h - 2, R - 1); ctx.lineWidth = 2; ctx.strokeStyle = '#0e1016'; ctx.stroke();
}

const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// Même rendu que la page : un bloc arrondi, trait coloré continu à gauche, lueur de chaque tier, lettre qui rayonne, légende dessous.
async function buildShareImage(list) {
  try { await Promise.all([document.fonts.load('800 60px "Baloo 2"'), document.fonts.load('600 14px Inter')]); } catch { /* polices système */ }
  const W = 1200, PAD = 24, LABEL = 170, PW = 100, PH = 142, GAP = 8, ROWPAD = 10, BAR = 12;
  const perRow = Math.floor((W - PAD * 2 - LABEL - 12) / (PW + GAP));
  const sections = list.tiers.map((t) => ({ tier: t, keys: t.items.filter((k) => list.items[k]) }));
  const rowH = (n) => Math.max(1, Math.ceil(n / perRow)) * (PH + GAP) - GAP + ROWPAD * 2;
  const heights = sections.map((x) => rowH(x.keys.length));
  const boxH = heights.reduce((s, h) => s + h, 0) + (sections.length - 1) * 2;
  const H = PAD * 2 + boxH + 5;

  const urls = new Map();
  sections.flatMap((x) => x.keys).forEach((k) => { if (!urls.has(k)) urls.set(k, imgUrl(list.items[k].i)); });
  const imgs = new Map(await Promise.all([...urls].map(async ([k, u]) => [k, await loadImage(u)])));

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#23262f'; ctx.fillRect(0, 0, W, H); // fond de la page

  const x0 = PAD, y0 = PAD, w = W - PAD * 2;
  rr(ctx, x0, y0 + 5, w, boxH, 16); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); // relief du bloc
  ctx.save();
  rr(ctx, x0, y0, w, boxH, 16); ctx.clip();
  ctx.fillStyle = '#1c1f27'; ctx.fillRect(x0, y0, w, boxH);

  let y = y0;
  const centers = [];
  sections.forEach(({ tier, keys }, idx) => {
    const h = heights[idx];
    if (idx) { ctx.fillStyle = '#0f1117'; ctx.fillRect(x0, y - 2, w, 2); } // trait sombre entre deux tiers

    // lettre : couleur du tier à plat, comme sur la page
    const long = tier.name.length > 3, size = long ? 34 : 64;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '800 ' + size + 'px "Baloo 2", sans-serif';
    const cx = x0 + BAR + (LABEL - BAR) / 2, base = y + h / 2 + (tier.desc ? 8 : size * 0.3);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowOffsetY = 2; ctx.fillStyle = tier.color; ctx.fillText(tier.name.slice(0, 12), cx, base); ctx.restore();
    if (tier.desc) { // légende sur une ou deux lignes
      ctx.font = '600 14px Inter, sans-serif'; ctx.fillStyle = '#8f98b8';
      const words = tier.desc.split(' '); let line = '', ly = base + 24;
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > LABEL - 24 && line) { ctx.fillText(line, cx, ly); line = wd; ly += 17; } else line = t; }
      ctx.fillText(line, cx, ly);
    }
    keys.forEach((k, i) => {
      const px = x0 + LABEL + 6 + (i % perRow) * (PW + GAP), py = y + ROWPAD + Math.floor(i / perRow) * (PH + GAP);
      drawPoster(ctx, imgs.get(k), list.items[k].t, px, py, PW, PH);
    });
    centers.push(y + h / 2);
    y += h + 2;
  });

  // trait coloré continu sur le bord gauche : un seul dégradé qui traverse tous les tiers
  const bar = ctx.createLinearGradient(0, y0, 0, y0 + boxH);
  sections.forEach(({ tier }, i) => bar.addColorStop(Math.min(1, (centers[i] - y0) / boxH), tier.color));
  ctx.fillStyle = bar; ctx.fillRect(x0, y0, BAR, boxH);
  ctx.restore();
  rr(ctx, x0, y0, w, boxH, 16); ctx.lineWidth = 2; ctx.strokeStyle = '#12141b'; ctx.stroke();
  return cv;
}

async function refreshShare() {
  const my = ++SH.busy, list = cur();
  const img = $('#shImg');
  $('#shState').textContent = 'Création de l’image…';
  $('#shState').hidden = false; img.hidden = true;
  ['shDl', 'shCopy', 'shShare'].forEach((id) => { $('#' + id).disabled = true; });
  const cv = await buildShareImage(list);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (my !== SH.busy) return; // une demande plus récente a pris le relais
  SH.blob = blob;
  if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
  img.dataset.url = URL.createObjectURL(blob);
  img.src = img.dataset.url;
  img.hidden = false; $('#shState').hidden = true;
  ['shDl', 'shCopy', 'shShare'].forEach((id) => { $('#' + id).disabled = false; });
}

function openShare() {
  const file = new File([new Blob()], 'x.png', { type: 'image/png' });
  $('#shShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  $('#shCopy').hidden = !(window.ClipboardItem && navigator.clipboard?.write);
  if (!$('#dlgShare').open) $('#dlgShare').showModal();
  refreshShare();
}

const shareName = () => 'ranku-' + (cur().name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tier-list') + '.png';

$('#shDl').onclick = () => {
  if (!SH.blob) return;
  const a = h('a', { href: URL.createObjectURL(SH.blob), download: shareName() });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Image téléchargée');
};
$('#shCopy').onclick = async () => {
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': SH.blob })]); toast('Image copiée : colle-la où tu veux'); }
  catch { toast('Copie impossible ici, utilise « Télécharger »'); }
};
$('#shShare').onclick = async () => {
  const file = new File([SH.blob], shareName(), { type: 'image/png' });
  try { await navigator.share({ files: [file], title: cur().name, text: `Ma tier list « ${cur().name} » faite avec Ranku` }); }
  catch (e) { if (e.name !== 'AbortError') toast('Partage impossible, utilise « Télécharger »'); }
};
$('#shClose').onclick = () => $('#dlgShare').close();
$('#dlgShare').addEventListener('click', (e) => { if (e.target === $('#dlgShare')) $('#dlgShare').close(); });
$('#dlgShare').addEventListener('close', () => { SH.busy++; });

// Trait de couleur de gauche : un seul dégradé qui passe d'un tier à l'autre, placé d'après la hauteur réelle de chaque ligne.
function updateBar() {
  const box = $('#board .tiers');
  if (!box || !box.offsetHeight) return;
  const H = box.offsetHeight;
  const stops = [...box.querySelectorAll('.tier')].map((r) => `${r.style.getPropertyValue('--c1')} ${Math.round(((r.offsetTop + r.offsetHeight / 2) / H) * 1000) / 10}%`);
  box.style.setProperty('--bar', `linear-gradient(180deg, ${stops.join(', ')})`);
}
window.addEventListener('resize', updateBar);

// ---------- Import de la liste AniList par pseudo (animés terminés) ----------
const IMPORT_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5L12 15l4.5-4.5M5 19h14"/></svg>';
const ANI_COLLECTION_Q = 'query($u:String,$c:Int){MediaListCollection(userName:$u,type:ANIME,status:COMPLETED,chunk:$c,perChunk:500){hasNextChunk lists{entries{media{id idMal format seasonYear title{romaji english} coverImage{large}}}}}}';

async function aniCollection(user, chunk) {
  let res;
  try {
    res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: ANI_COLLECTION_Q, variables: { u: user, c: chunk } }),
    });
  } catch { throw new Error('network'); }
  if (res.status === 429) throw new Error('rate');
  const j = await res.json().catch(() => null);
  const err = j?.errors?.[0];
  if (err) throw new Error(/private/i.test(err.message) ? 'private' : err.status === 404 ? 'notfound' : 'other');
  if (!res.ok || !j?.data) throw new Error('network');
  return j.data.MediaListCollection;
}

// récupère tous les animés terminés (par paquets de 500, avec une pause pour respecter la limite d'AniList)
async function fetchCompleted(user, onProgress) {
  const medias = [], seen = new Set();
  for (let chunk = 1; chunk <= 20; chunk++) {
    const col = await aniCollection(user, chunk);
    for (const l of col.lists || []) for (const en of l.entries || []) {
      const m = en.media;
      if (m && !seen.has(m.id)) { seen.add(m.id); medias.push(m); }
    }
    onProgress?.(medias.length);
    if (!col.hasNextChunk) break;
    await new Promise((r) => setTimeout(r, 800));
  }
  return medias;
}

// Ajoute les animés AniList à une liste SANS toucher à ce qui y est déjà : seuls les nouveaux arrivent dans « Non classé ».
// Une licence déjà présente reçoit juste ses nouvelles saisons ; un animé déjà placé (même séparé) n'est jamais remis.
function importInto(list, medias) {
  const stats = { anime: medias.length, added: 0, present: 0, updated: 0, merged: 0, ignored: 0 };
  const fresh = new Set(); // cartes créées pendant cet import
  for (const m of medias) {
    const i = rowByAnilist.get(m.id) ?? (m.idMal ? rowByMal.get(m.idMal) : undefined);
    let key, item;
    if (i !== undefined) {
      const r = animeData.rows[i], gid = r[8];
      if (gid) {
        const g = groupRows(gid), keys = g.map(rowKey), have = groupItemKey(list, gid);
        if (have) {
          if (fresh.has(have)) { stats.merged++; continue; } // deux saisons de la même licence dans ta liste AniList
          const card = list.items[have], add = keys.filter((k) => !card.m.includes(k) && !list.items[k]);
          if (add.length) { card.m.push(...add); stats.updated++; } else stats.present++;
          continue;
        }
        if (keys.some((k) => list.items[k])) { stats.present++; continue; } // une saison est déjà dans la liste (carte séparée)
        key = 'g' + rowKey(g[0]); item = { t: g[0][0], i: g[0][3], m: keys };
      } else { key = rowKey(r); item = { t: r[0], i: r[3] }; }
    } else if (m.format === 'TV' || m.format === 'TV_SHORT') { // série absente de la base (très récente)
      key = 'a' + m.id; item = { t: m.title.english || m.title.romaji, i: m.coverImage.large };
    } else { stats.ignored++; continue; } // film / OVA / ONA lié à une série : pas dans les licences
    if (list.items[key]) { stats.present++; continue; }
    list.items[key] = item; list.pool.push(key); fresh.add(key); stats.added++;
  }
  return stats;
}

const IMP = { dest: 'current' };

function setImport(kind, text) {
  const s = $('#impState');
  s.hidden = !text;
  s.className = 'imp-state ' + kind;
  s.textContent = text || '';
}

function renderImportDest() {
  const opt = (dest, title, desc) => h('button', { class: 'imp-opt' + (IMP.dest === dest ? ' on' : ''), dataset: { dest }, type: 'button' },
    h('i', { class: 'rd' }), h('span', {}, h('b', {}, title), h('small', {}, desc)));
  $('#impDest').replaceChildren(
    h('div', { class: 'imp-q' }, 'Où ajouter tes animés ?'),
    opt('current', `Dans ma liste « ${cur().name} »`, 'Les nouveaux animés arrivent dans « Non classé ». Ce que tu as déjà rangé ne bouge pas.'),
    opt('new', 'Dans une nouvelle liste', 'Crée une liste séparée « AniList · ton pseudo » et laisse ta liste actuelle intacte.'));
}
$('#impDest').addEventListener('click', (e) => {
  const b = e.target.closest('[data-dest]');
  if (b) { IMP.dest = b.dataset.dest; renderImportDest(); }
});

function openImport() {
  setImport('', '');
  IMP.dest = 'current';
  renderImportDest();
  $('#impUser').value = cur().ani || db.ani || '';
  $('#impGo').disabled = false;
  $('#impGo').textContent = 'Importer';
  $('#impGo').onclick = runImport;
  $('#dlgImport').showModal();
  $('#impUser').focus();
  loadData().catch(() => {});
}

const IMPORT_ERRORS = {
  notfound: 'Ce pseudo n’existe pas sur AniList. Vérifie l’orthographe.',
  private: 'Ce profil est privé : passe-le en public dans les réglages AniList pour l’importer.',
  rate: 'AniList limite le nombre de requêtes. Réessaie dans une minute.',
  network: 'Impossible de joindre AniList. Vérifie ta connexion et réessaie.',
  other: 'AniList a renvoyé une erreur. Réessaie un peu plus tard.',
};

async function runImport() {
  const user = $('#impUser').value.trim().replace(/^@/, '');
  if (!user) { $('#impUser').focus(); return; }
  $('#impGo').disabled = true;
  setImport('load', 'Chargement de ta liste…');
  try {
    await loadData();
    const medias = await fetchCompleted(user, (n) => setImport('load', `${n} animés récupérés…`));
    if (!medias.length) { setImport('err', 'Aucun animé terminé trouvé pour ce pseudo.'); $('#impGo').disabled = false; return; }
    let list = cur();
    if (IMP.dest === 'new') { list = newList('AniList · ' + user); db.lists.push(list); db.cur = list.id; }
    const stats = importInto(list, medias);
    list.ani = user; db.ani = user; // on s'en souvient pour le prochain import
    save(); render();

    const s = (n) => (n > 1 ? 's' : '');
    const parts = [`${stats.anime} animés terminés sur AniList.`];
    parts.push(stats.added ? `${stats.added} nouvelle${s(stats.added)} carte${s(stats.added)} dans « Non classé » de « ${list.name} ».` : 'Rien de nouveau à ajouter.');
    if (stats.present) parts.push(`${stats.present} déjà dans ta liste, laissé${s(stats.present)} tel${s(stats.present)} quel${s(stats.present)}.`);
    if (stats.updated) parts.push(`${stats.updated} licence${s(stats.updated)} ${stats.updated > 1 ? 'ont' : 'a'} reçu de nouvelles saisons.`);
    if (stats.merged) parts.push(`${stats.merged} saison${s(stats.merged)} regroupée${s(stats.merged)} avec leur licence.`);
    if (stats.ignored) parts.push(`${stats.ignored} film${s(stats.ignored)} / OVA lié${s(stats.ignored)} à une série laissé${s(stats.ignored)} de côté.`);
    setImport('ok', parts.join(' '));
    $('#impGo').textContent = 'Terminé';
    $('#impGo').disabled = false;
    $('#impGo').onclick = () => { $('#dlgImport').close(); $('#impGo').onclick = runImport; };
  } catch (e) {
    setImport('err', IMPORT_ERRORS[e.message] || IMPORT_ERRORS.other);
    $('#impGo').disabled = false;
  }
}
$('#impGo').onclick = runImport;
$('#impUser').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#impGo').click(); } });
$('#impClose').onclick = () => { $('#dlgImport').close(); $('#impGo').onclick = runImport; };

// ---------- Tier lists de personnages ----------
const USER_ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
let listType = 'anime';

// choix « Animés / Personnages » à la création d'une liste
function renderListType() {
  const opt = (t, title, desc) => h('button', { class: 'imp-opt' + (listType === t ? ' on' : ''), dataset: { lt: t }, type: 'button' },
    h('i', { class: 'rd' }), h('span', {}, h('b', {}, title), h('small', {}, desc)));
  $('#listType').replaceChildren(
    opt('anime', 'Animés', 'Affiches des animés, saisons regroupées par licence.'),
    opt('char', 'Personnages', 'Portraits de personnages : cherche n’importe lequel, ou ajoute les principaux de tes animés.'));
}
$('#listType').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lt]');
  if (b) { listType = b.dataset.lt; renderListType(); }
});

// recherche de personnages sur AniList (tous les personnages, y compris les méchants)
const CHAR_SEARCH_Q = 'query($s:String){Page(perPage:30){characters(search:$s,sort:SEARCH_MATCH){id name{full} image{large} media(perPage:1,sort:POPULARITY_DESC){nodes{title{romaji english}}}}}}';
const isPlaceholderImg = (u) => !u || /default\.(jpg|png)/.test(u);

async function doCharSearch(q) {
  $('#results').replaceChildren(h('div', { class: 'sw-hint' }, h('p', {}, 'Recherche sur AniList…')));
  $('#srCnt').textContent = '';
  let items = [], error = false;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: CHAR_SEARCH_Q, variables: { s: q } }),
    });
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    items = (j.data.Page.characters || []).filter((c) => !isPlaceholderImg(c.image.large)).map((c) => {
      const t = c.media.nodes[0]?.title;
      return { key: 'c' + c.id, char: true, title: c.name.full, img: c.image.large, fmt: 'CHAR', sub: t ? (t.english || t.romaji) : '' };
    });
  } catch { error = true; }
  if ($('#q').value.trim() !== q) return; // une frappe plus récente a pris le relais
  S.items = items; S.ani = []; S.aniState = '';
  if (error) { $('#results').replaceChildren(h('div', { class: 'sw-hint' }, h('div', { class: 'big' }, '📡'), h('p', {}, 'AniList est indisponible pour le moment.'), h('small', {}, 'Vérifie ta connexion et réessaie.'))); return; }
  renderSearch(true);
}

// ---------- Personnages principaux de mes animés ----------
const CH = { src: null };
// deux requêtes distinctes : AniList renvoie une erreur 500 si on mélange id_in et idMal_in
const CHAR_MAIN_FIELDS = 'id title{romaji english} characters(role:MAIN,perPage:8,sort:RELEVANCE){nodes{id name{full} image{large}}}';
const CHAR_MAIN_Q_ID = 'query($ids:[Int]){Page(perPage:25){media(id_in:$ids,type:ANIME){' + CHAR_MAIN_FIELDS + '}}}';
const CHAR_MAIN_Q_MAL = 'query($mals:[Int]){Page(perPage:25){media(idMal_in:$mals,type:ANIME){' + CHAR_MAIN_FIELDS + '}}}';

// animés d'une liste -> références AniList / MAL (pour une licence : sa jaquette et ses 3 premières saisons)
function mediaRefs(list) {
  const refs = [];
  for (const k of Object.keys(list.items)) {
    const it = list.items[k];
    for (const mk of it.m ? it.m.slice(0, 4) : [k]) {
      const r = rowOfKey(mk);
      let ani = 0, mal = 0;
      if (r) { ani = r[4]; mal = r[5]; } else if (mk[0] === 'a') ani = Number(mk.slice(1)); else if (mk[0] === 'm') mal = Number(mk.slice(1));
      if (ani || mal) refs.push({ ani, mal, title: it.t });
    }
  }
  return refs;
}

async function charBatch(ids, mals) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(ids.length ? { query: CHAR_MAIN_Q_ID, variables: { ids } } : { query: CHAR_MAIN_Q_MAL, variables: { mals } }),
      });
    } catch { throw new Error('network'); }
    if (res.status === 429 && attempt === 0) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('Retry-After')) || 30) * 1000)); continue; }
    if (res.status === 429) throw new Error('rate');
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.data) throw new Error('network');
    return j.data.Page.media || [];
  }
  return [];
}

function setChars(kind, text) {
  const s = $('#chState');
  s.hidden = !text;
  s.className = 'imp-state ' + kind;
  s.textContent = text || '';
}

function renderCharSources() {
  const lists = db.lists.filter((l) => l.type !== 'char' && Object.keys(l.items).length);
  if (!lists.some((l) => l.id === CH.src)) CH.src = (lists.find((l) => l.ani) || lists[0])?.id || null;
  $('#chSrc').replaceChildren(
    h('div', { class: 'imp-q' }, 'À partir de quelle liste d’animés ?'),
    ...(lists.length
      ? lists.map((l) => h('button', { class: 'imp-opt' + (CH.src === l.id ? ' on' : ''), dataset: { src: l.id }, type: 'button' },
        h('i', { class: 'rd' }), h('span', {}, h('b', {}, l.name), h('small', {}, `${Object.keys(l.items).length} cartes`))))
      : [h('p', { class: 'imp-note' }, 'Tu n’as pas encore de liste d’animés avec des cartes : importe ou ajoute d’abord des animés dans une liste « Animés ».')]));
  $('#chGo').disabled = !lists.length;
}
$('#chSrc').addEventListener('click', (e) => {
  const b = e.target.closest('[data-src]');
  if (b) { CH.src = b.dataset.src; renderCharSources(); }
});

function openChars() {
  setChars('', '');
  renderCharSources();
  $('#chGo').textContent = 'Ajouter';
  $('#chGo').onclick = runChars;
  $('#dlgChars').showModal();
  loadData().catch(() => {});
}

async function runChars() {
  const src = db.lists.find((l) => l.id === CH.src), target = cur();
  if (!src) return;
  $('#chGo').disabled = true;
  setChars('load', 'Préparation…');
  try {
    await loadData();
    const refs = mediaRefs(src);
    const ids = [...new Set(refs.filter((r) => r.ani).map((r) => r.ani))];
    const mals = [...new Set(refs.filter((r) => !r.ani && r.mal).map((r) => r.mal))];
    const titleOf = new Map();
    refs.forEach((r) => { if (r.ani && !titleOf.has('a' + r.ani)) titleOf.set('a' + r.ani, r.title); if (r.mal && !titleOf.has('m' + r.mal)) titleOf.set('m' + r.mal, r.title); });
    const batches = [];
    for (let i = 0; i < ids.length; i += 25) batches.push([ids.slice(i, i + 25), []]);
    for (let i = 0; i < mals.length; i += 25) batches.push([[], mals.slice(i, i + 25)]);

    const found = new Map(); // clé personnage -> carte
    for (let b = 0; b < batches.length; b++) {
      setChars('load', `Lot ${b + 1} / ${batches.length} · ${found.size} personnages trouvés…`);
      for (const m of await charBatch(...batches[b])) {
        const title = titleOf.get('a' + m.id) || m.title.english || m.title.romaji;
        for (const c of m.characters.nodes) {
          const key = 'c' + c.id;
          if (!found.has(key) && !isPlaceholderImg(c.image.large)) found.set(key, { t: c.name.full, i: c.image.large, a: title });
        }
      }
      if (b < batches.length - 1) await new Promise((r) => setTimeout(r, 1200));
    }
    let added = 0, present = 0;
    for (const [key, item] of found) {
      if (target.items[key]) { present++; continue; }
      target.items[key] = item; target.pool.push(key); added++;
    }
    save(); render();
    const s = (n) => (n > 1 ? 's' : '');
    setChars('ok', [
      `${refs.length ? ids.length + mals.length : 0} animés analysés.`,
      added ? `${added} personnage${s(added)} principa${added > 1 ? 'ux' : 'l'} ajouté${s(added)} dans « Non classé ».` : 'Rien de nouveau à ajouter.',
      present ? `${present} déjà dans la liste, laissé${s(present)} tel${s(present)} quel${s(present)}.` : '',
    ].filter(Boolean).join(' '));
    $('#chGo').textContent = 'Terminé';
    $('#chGo').disabled = false;
    $('#chGo').onclick = () => { $('#dlgChars').close(); };
  } catch (e) {
    setChars('err', e.message === 'rate' ? 'AniList limite le nombre de requêtes. Réessaie dans une minute.' : 'Impossible de joindre AniList. Vérifie ta connexion et réessaie.');
    $('#chGo').disabled = false;
  }
}
$('#chClose').onclick = () => $('#dlgChars').close();

// ---------- Changer l'image d'une carte (depuis l'appareil ou une adresse), retour à l'image d'origine ----------
const MAX_SIDE = 450; // les images choisies sont réduites : elles sont enregistrées dans le navigateur

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(im.width, im.height));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.86));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    im.src = url;
  });
}

function setCardImage(key, src) {
  const it = cur().items[key];
  if (!it) return;
  if (it.i0 === undefined) it.i0 = it.i; // on garde l'image d'origine
  it.i = src;
  save(); render(); renderFiche();
}

$('#fiPick').onclick = () => $('#fiFile').click();
$('#fiFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !ficheKey) return;
  try { setCardImage(ficheKey, await fileToDataUrl(file)); toast('Image changée'); }
  catch { toast('Cette image n’a pas pu être lue'); }
});

$('#fiLinkBtn').onclick = () => { $('#fiLink').hidden = !$('#fiLink').hidden; if (!$('#fiLink').hidden) $('#fiUrl').focus(); };
$('#fiUrlOk').onclick = async () => {
  const url = $('#fiUrl').value.trim();
  if (!/^https?:\/\//i.test(url) || !ficheKey) { toast('Colle l’adresse complète d’une image (https://…)'); return; }
  const ok = await new Promise((r) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => r(true); im.onerror = () => r(false); im.src = url; });
  if (!ok) { toast('Ce site n’autorise pas l’image : télécharge-la puis choisis-la depuis ton appareil'); return; }
  setCardImage(ficheKey, url);
  $('#fiUrl').value = ''; $('#fiLink').hidden = true;
  toast('Image changée');
};
$('#fiReset').onclick = () => {
  const it = cur().items[ficheKey];
  if (!it || it.i0 === undefined) return;
  it.i = it.i0; delete it.i0;
  save(); render(); renderFiche();
  toast('Image d’origine remise');
};

// ---------- Démarrage ----------
document.body.classList.add('boot'); // animation d'arrivée, retirée ensuite pour ne pas se rejouer
setTimeout(() => document.body.classList.remove('boot'), 1400);
render();
loadData().catch(() => {}); // précharge la base pour que les affiches et la recherche soient prêtes
if ('serviceWorker' in navigator) {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    // En local on veut toujours la dernière version : pas de service worker, et on nettoie ceux d'avant.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  } else if (location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
