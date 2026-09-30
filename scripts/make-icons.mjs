// Generates the app icons (pink background, white heart) as PNG, no dependencies.
import fs from 'node:fs';
import zlib from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, { maskable = false } = {}) {
  const top = [0xf0, 0x73, 0x9f], bottom = [0x9d, 0x2f, 0x6b];
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const scale = maskable ? 0.55 : 0.7; // maskable icons keep a safe zone
  const S = 4; // supersampling for smooth edges
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const t = y / size;
      let r = top[0] + (bottom[0] - top[0]) * t, g = top[1] + (bottom[1] - top[1]) * t, b = top[2] + (bottom[2] - top[2]) * t;
      let cover = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const u = ((x + (sx + 0.5) / S) / size - 0.5) / (scale / 2) * 1.25;
        const v = -((y + (sy + 0.5) / S) / size - 0.52) / (scale / 2) * 1.25;
        const h = (u * u + v * v - 1) ** 3 - u * u * v * v * v; // heart curve
        if (h <= 0) cover++;
      }
      const a = cover / (S * S);
      r = r + (255 - r) * a; g = g + (255 - g) * a; b = b + (255 - b) * a;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync('public/icons/icon-192.png', png(192));
fs.writeFileSync('public/icons/icon-512.png', png(512));
fs.writeFileSync('public/icons/maskable-512.png', png(512, { maskable: true }));
fs.writeFileSync('public/icons/apple-touch-icon.png', png(180));
console.log('icons ok');
