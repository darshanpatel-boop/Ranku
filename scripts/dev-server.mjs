// Petit serveur local pour tester le site : node scripts/dev-server.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';

const PORT = Number(process.argv[2]) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('\\').join('/');
  p = normalize(p).split('\\').join('/').replace(/^\/+/, '');
  if (!p || p.endsWith('/')) p += 'index.html';
  if (p.startsWith('..')) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(join(process.cwd(), p));
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Introuvable');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`http://localhost:${PORT}/`);
  for (const l of Object.values(networkInterfaces()).flat()) if (l.family === 'IPv4' && !l.internal) console.log(`Réseau : http://${l.address}:${PORT}/`);
});
