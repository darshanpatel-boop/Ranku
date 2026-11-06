// Télécharge anime-offline-database (manami-project, ODbL 1.0) et produit data/anime.json (léger, pour la recherche).
// Usage : node scripts/build-data.mjs [--no-download]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const URL_DB = 'https://github.com/manami-project/anime-offline-database/releases/latest/download/anime-offline-database-minified.json';
const RAW = 'data-raw/aod.json';
const OUT = 'data/anime.json';
const MAL_IMG = 'https://cdn.myanimelist.net/images/anime/';

// Types gardés pour la recherche (SPECIAL et UNKNOWN écartés : bruit).
const TYPES = ['TV', 'MOVIE', 'ONA', 'OVA'];

mkdirSync('data-raw', { recursive: true });
mkdirSync('data', { recursive: true });

if (!process.argv.includes('--no-download') || !existsSync(RAW)) {
  const res = await fetch(URL_DB);
  if (!res.ok) throw new Error('Téléchargement impossible : ' + res.status);
  writeFileSync(RAW, Buffer.from(await res.arrayBuffer()));
}

const db = JSON.parse(readFileSync(RAW, 'utf8'));

const idFrom = (sources, host) => {
  const u = sources.find((s) => s.includes(host + '/anime/'));
  const m = u && u.match(/\/anime\/(\d+)/);
  return m ? Number(m[1]) : 0;
};

// Synonymes en alphabet latin uniquement (les autres alourdissent sans aider la recherche).
const latin = (s) => /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]+$/u.test(s);

// Forme normalisée (sans accents ni ponctuation) pour écarter les variantes quasi identiques (L'Attaque / L’attaque).
const normName = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const rows = [];
for (const a of db.data) {
  if (!TYPES.includes(a.type)) continue;
  const anilist = idFrom(a.sources, 'anilist.co');
  const mal = idFrom(a.sources, 'myanimelist.net');
  if (!anilist && !mal) continue;
  const pic = a.picture.startsWith(MAL_IMG) ? a.picture.slice(MAL_IMG.length) : a.picture;
  const seen = new Set([normName(a.title)]);
  const syn = a.synonyms.filter(latin).filter((x) => { const k = normName(x); return k && !seen.has(k) && seen.add(k); }).slice(0, 40);
  // [titre, type, année, image, idAniList, idMAL, synonymes, score]
  rows.push([
    a.title,
    TYPES.indexOf(a.type),
    a.animeSeason?.year || 0,
    pic,
    anilist,
    mal,
    syn,
    a.score?.arithmeticMean ? Math.round(a.score.arithmeticMean * 100) / 100 : 0,
  ]);
}

const out = JSON.stringify({
  source: 'anime-offline-database (manami-project), licence ODbL 1.0',
  lastUpdate: db.lastUpdate,
  imgBase: MAL_IMG,
  types: TYPES,
  rows,
});
writeFileSync(OUT, out);
console.log(`${db.data.length} entrées brutes -> ${rows.length} gardées`);
console.log(`data/anime.json : ${(out.length / 1e6).toFixed(2)} Mo, gzip ${(gzipSync(out).length / 1e6).toFixed(2)} Mo`);
