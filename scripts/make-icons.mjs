// Génère icons/icon-192.png, icon-512.png, icon-maskable-512.png (barres de tier sur fond sombre). Sans dépendance.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

const BARS = [[255, 93, 115], [255, 159, 67], [255, 210, 77], [123, 216, 143], [95, 176, 255]];
const BG = [22, 22, 42];

function icon(size, safe) {
  // zone utile : `safe` = fraction du côté occupée par les barres
  const m = Math.round((size * (1 - safe)) / 2);
  const inner = size - 2 * m;
  const bandH = Math.floor(inner / (BARS.length * 2 - 1));
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let px = BG;
      const yy = y - m;
      if (yy >= 0 && yy < bandH * (BARS.length * 2 - 1) && x >= m && x < size - m) {
        const i = Math.floor(yy / bandH);
        if (i % 2 === 0) {
          // barre plus courte vers le bas pour évoquer une tier list
          const len = inner * (1 - (i / 2) * 0.12);
          if (x - m < len) px = BARS[i / 2];
        }
      }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = px[0]; raw[o + 1] = px[1]; raw[o + 2] = px[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('icons', { recursive: true });
writeFileSync('icons/icon-192.png', icon(192, 0.62));
writeFileSync('icons/icon-512.png', icon(512, 0.62));
writeFileSync('icons/icon-maskable-512.png', icon(512, 0.5));
console.log('icônes créées');
