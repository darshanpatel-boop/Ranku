// Données de démonstration communes aux pages de test (indices dans MOCK).
const TIERS = [
  { n: 'S', c1: '#ff7aa2', c2: '#ec4899', ink: '#fff', items: [0, 1, 2] },
  { n: 'A', c1: '#ffb83d', c2: '#f59e0b', ink: '#2a1a00', items: [3, 4, 5, 6] },
  { n: 'B', c1: '#ffe066', c2: '#facc15', ink: '#2a2200', items: [7, 8, 9] },
  { n: 'C', c1: '#4ade9f', c2: '#10b981', ink: '#04281c', items: [10, 11] },
  { n: 'D', c1: '#6ea0ff', c2: '#3b82f6', ink: '#fff', items: [12] },
];
const POOL = [13, 14, 15, 16];
const poster = (i, cls = '') => `<img class="poster ${cls}" src="${MOCK[i].i}" alt="${MOCK[i].t}" title="${MOCK[i].t}" loading="lazy">`;
const rowsHtml = (inner) => TIERS.map((t) => inner(t)).join('');
const NAV = `
<header class="nav"><div class="in">
  <div class="logo"><span>Ran</span><b>ku</b></div>
  <nav class="tabs"><a class="on">Mes tier lists</a><a>Recherche</a><a>Animés</a><a>Personnages</a></nav>
  <a class="back" href="index.html">← Les 3 propositions</a>
</div></header>`;
document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin', NAV));
