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
let sortables = [];
let lastDrag = 0; // pour ne pas ouvrir la fiche juste après un glisser-déposer
let freshKey = null, freshTier = null; // pour animer ce qui vient d'être ajouté
let imgBase = 'https://cdn.myanimelist.net/images/anime/';

const imgUrl = (i) => (i.startsWith('http') ? i : imgBase + i);

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
    h('button', { class: 'add-anime', type: 'button' }, svgEl('<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'), h('span', { class: 'aa-t' }, 'Rechercher un animé à ajouter…'), h('kbd', {}, '/'), h('span', { class: 'aa-b' }, 'Ajouter')),
    h('div', { class: 'cork' },
      h('div', { class: 'note' }, 'Non classé'),
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
}

function detach(list, key) {
  list.pool = list.pool.filter((k) => k !== key);
  list.tiers.forEach((t) => (t.items = t.items.filter((k) => k !== key)));
}

$('#board').addEventListener('click', (e) => {
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
        l.name, on ? h('span', { class: 'ed' }, svgEl(PENCIL)) : null);
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
  else { const l = newList(name); db.lists.push(l); db.cur = l.id; }
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
let rowByKey = new Map(); // clé (a<idAniList> / m<idMAL>) -> indice de ligne dans la base

function loadData() {
  if (animeData) return Promise.resolve();
  loading ||= fetch('data/anime.json').then((r) => r.json()).then((d) => {
    animeData = d;
    imgBase = d.imgBase;
    rowByKey = new Map(d.rows.map((r, i) => [rowKey(r), i]));
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

function addItem(key, title, image) {
  const list = cur();
  if (list.items[key]) return false;
  list.items[key] = { t: title, i: image };
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
    h('span', { class: 'sr-meta' }, h('span', { class: 'sr-tag t-' + it.fmt }, TYPE_FR[it.fmt] || it.fmt), it.gid ? ` ${it.n} saisons et films` : (it.year ? ' ' + it.year : '')));
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
    ...PILLS.map(([k, n]) => h('button', { class: 'sw-pill' + (S.type === k ? ' on' : ''), dataset: { ty: k }, type: 'button' },
      n, q.length >= 2 ? h('small', {}, String(all.filter((it) => inPill(it, k)).length)) : null)),
    h('span', { class: 'sw-tog' + (S.hide ? ' on' : ''), id: 'srTog' }, h('i'), 'Masquer ceux déjà ajoutés'));

  const visible = (arr) => arr.filter((it) => inPill(it, S.type) && !(S.hide && isAdded(it)));
  const loc = visible(S.items), ani = visible(S.ani);
  const aniLabel = { '': 'Pas trouvé ? Chercher aussi sur AniList', loading: 'Recherche sur AniList…', done: S.ani.length ? `AniList : ${S.ani.length} résultat${S.ani.length > 1 ? 's' : ''} en plus` : 'Rien de plus sur AniList', error: 'AniList indisponible — réessayer' }[S.aniState];

  if (q.length < 2) {
    grid.replaceChildren(h('div', { class: 'sw-hint' },
      h('div', { class: 'big' }, '🔎'), h('p', {}, 'Tape le titre d’un animé'),
      h('small', {}, 'En français, en anglais ou en japonais : « L’Attaque des Titans » et « Shingeki no Kyojin » marchent tous les deux.')));
    $('#srCnt').textContent = '';
  } else if (!loc.length && !ani.length) {
    grid.replaceChildren(h('div', { class: 'sw-hint' },
      h('div', { class: 'big' }, '🤔'), h('p', {}, `Rien dans la base pour « ${q} ».`),
      h('small', {}, 'Les sorties très récentes ne sont pas toujours dedans.'),
      S.aniState === '' || S.aniState === 'error' ? h('button', { class: 'sw-go', id: 'srAni2', type: 'button' }, 'Chercher sur AniList') : null));
    $('#srCnt').textContent = '';
  } else {
    grid.replaceChildren(...loc.map((it, i) => srItem(it, q, i)),
      ani.length ? h('div', { class: 'sw-sep' }, 'Sur AniList') : null, ...ani.map((it, i) => srItem(it, q, i)));
    $('#srCnt').textContent = `${loc.length + ani.length} résultat${loc.length + ani.length > 1 ? 's' : ''}`;
  }
  grid.scrollTop = top;

  const link = $('#srAni');
  link.hidden = q.length < 2;
  link.textContent = aniLabel;
  $('#srCount').textContent = S.session.size ? `${S.session.size} ajouté${S.session.size > 1 ? 's' : ''}` : '';
}

async function doSearch() {
  const q = $('#q').value.trim();
  S.ani = []; S.aniState = '';
  if (q.length < 2) { S.items = []; renderSearch(true); return; }
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
  else if (it.gid) { openDrawer(it); return; } // une licence : on choisit d'abord les saisons vues
  else { addItem(it.key, it.title, it.img); S.session.add(it.key); showUndo(it); }
  refreshItem(it, !!keyInList(it));
}

// ---------- Tiroir « quelles saisons as-tu vues ? » ----------
const D = { it: null, picks: new Set() };
const CB = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// une ligne saison / film : case, étiquette de type, titre, année (comme dans la fiche de licence)
function memberLine(r, { on, off, act }) {
  const f = fmtOf(r);
  return h('button', { class: 'dr-m' + (on ? ' on' : '') + (off ? ' off' : ''), type: 'button', dataset: { mk: rowKey(r) }, ...(off ? { disabled: '' } : {}), ...(act ? { 'data-act': act } : {}) },
    h('i', { class: 'cb' }, svgEl(CB)),
    h('span', { class: 'sr-tag t-' + f }, TYPE_FR[f]),
    h('span', { class: 't' }, r[0]),
    h('em', {}, r[2] || ''));
}

function renderDrawer() {
  const it = D.it, list = cur(), rows = groupRows(it.gid);
  const apart = (r) => !!list.items[rowKey(r)];
  const n = rows.filter((r) => D.picks.has(rowKey(r))).length;
  $('#srDrawer').replaceChildren(
    h('div', { class: 'dr-head' },
      h('img', { src: imgUrl(it.img), alt: '' }),
      h('div', { class: 'dr-t' }, h('h4', {}, it.title), h('span', {}, 'Quelles saisons et quels films as-tu vus ?')),
      h('div', { class: 'dr-quick' },
        h('button', { class: 'sw-pill', dataset: { dq: 'all' }, type: 'button' }, 'Tout'),
        h('button', { class: 'sw-pill', dataset: { dq: 'tv' }, type: 'button' }, 'Séries'))),
    h('div', { class: 'dr-list' }, rows.map((r) => memberLine(r, { on: D.picks.has(rowKey(r)), off: apart(r) }))),
    h('div', { class: 'dr-act' },
      h('span', { class: 'dr-note' }, 'Une seule carte sera ajoutée pour toute la licence.'),
      h('button', { class: 'ghost', id: 'drCancel', type: 'button' }, 'Annuler'),
      h('button', { class: 'primary', id: 'drOk', type: 'button', ...(n ? {} : { disabled: '' }) }, `Ajouter ${n} élément${n > 1 ? 's' : ''}`)));
}

function openDrawer(it) {
  D.it = it;
  D.picks = new Set([rowKey(groupRows(it.gid)[0])]);
  renderDrawer();
  $('#srDrawer').classList.add('show');
}
function closeDrawer() { D.it = null; $('#srDrawer').classList.remove('show'); }

function confirmDrawer() {
  const it = D.it, list = cur();
  const m = groupRows(it.gid).map(rowKey).filter((k) => D.picks.has(k));
  if (!m.length) return;
  list.items[it.key] = { t: it.title, i: it.img, m };
  list.pool.push(it.key);
  freshKey = it.key;
  save(); render();
  S.session.add(it.key);
  closeDrawer();
  showUndo(it);
  refreshItem(it, true);
}

$('#srDrawer').addEventListener('click', (e) => {
  const m = e.target.closest('.dr-m');
  if (m && !m.disabled) { const k = m.dataset.mk; D.picks.has(k) ? D.picks.delete(k) : D.picks.add(k); renderDrawer(); return; }
  const q = e.target.closest('[data-dq]');
  if (q) {
    const list = cur();
    D.picks = new Set(groupRows(D.it.gid).filter((r) => !list.items[rowKey(r)] && (q.dataset.dq === 'all' || fmtOf(r) === 'TV')).map(rowKey));
    renderDrawer(); return;
  }
  if (e.target.closest('#drCancel')) closeDrawer();
  if (e.target.closest('#drOk')) confirmDrawer();
});

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
  closeDrawer();
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

function renderFiche() {
  const list = cur(), it = list.items[ficheKey];
  if (!it) { ficheKey = null; if ($('#dlgFiche').open) $('#dlgFiche').close(); return; }
  $('#fiImg').src = imgUrl(it.i);
  $('#fiTitle').textContent = it.t;
  const box = $('#fiList');
  const gid = it.m ? gidOf(it.m[0]) : gidOf(ficheKey);
  const rows = animeData && gid ? groupRows(gid) : [];

  if (it.m && rows.length) {
    $('#fiSub').textContent = `${it.m.length} sur ${rows.length} dans ta liste`;
    box.replaceChildren(
      h('p', { class: 'fi-hint' }, 'Coche ce que tu as vu. L’étoile choisit la jaquette de la carte, « Séparer » en fait une carte à part.'),
      ...rows.map((r) => {
        const k = rowKey(r), on = it.m.includes(k), apart = !!list.items[k] && k !== ficheKey && !on;
        return h('div', { class: 'fi-row' },
          memberLine(r, { on, off: apart, act: 'toggle' }),
          on ? fiAction(r[3] === it.i ? '★' : '☆', 'cover', k, r[3] === it.i ? 'on' : '') : null,
          on && it.m.length > 1 ? fiAction('Séparer', 'split', k) : null,
          apart ? fiAction('Regrouper', 'merge', k) : null);
      }));
  } else {
    const r = rowOfKey(ficheKey);
    $('#fiSub').textContent = r ? [TYPE_FR[fmtOf(r)], r[2] || null].filter(Boolean).join(' · ') : '';
    box.replaceChildren(
      rows.length > 1
        ? h('div', { class: 'fi-solo' }, h('p', {}, `Cette carte est séparée de sa licence (${rows.length} éléments).`), h('button', { class: 'ghost', id: 'fiRegroup', type: 'button' }, 'Regrouper avec sa licence'))
        : h('p', { class: 'fi-hint' }, 'Aucune autre saison liée à cet animé dans la base.'));
  }
}

function fiAct(act, k) {
  const list = cur(), it = list.items[ficheKey], r = rowOfKey(k);
  if (act === 'toggle') {
    if (it.m.includes(k)) {
      if (it.m.length === 1) return toast('Pour tout retirer, utilise « Retirer de ma liste »');
      it.m = it.m.filter((x) => x !== k);
    } else it.m.push(k);
  } else if (act === 'cover') {
    it.i = r[3];
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
  const m = e.target.closest('.dr-m');
  if (m && !m.disabled) { fiAct('toggle', m.dataset.mk); return; }
  if (e.target.closest('#fiRegroup')) regroupSolo();
});
$('#fiDel').onclick = () => { const k = ficheKey; $('#dlgFiche').close(); removeKey(k); };
$('#fiOk').onclick = () => $('#dlgFiche').close();
$('#fiClose').onclick = () => $('#dlgFiche').close();
$('#dlgFiche').addEventListener('click', (e) => { if (e.target === $('#dlgFiche')) $('#dlgFiche').close(); });
$('#dlgFiche').addEventListener('close', () => { ficheKey = null; });

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
