// Generates favicon.ico (32x32) and apple-touch-icon.png (180x180)
// from scratch using only Node built-ins (zlib). No external deps.

import zlib from 'zlib';
import fs   from 'fs';

// ── CRC32 ──────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG builder ────────────────────────────────────────────────────────
function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}

function makePNG(w, h, pixels /* Uint8Array w*h*4 RGBA */) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit depth, RGBA colour type

  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter byte: None
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const d = y * (1 + w * 4) + 1 + x * 4;
      raw[d] = pixels[s]; raw[d+1] = pixels[s+1];
      raw[d+2] = pixels[s+2]; raw[d+3] = pixels[s+3];
    }
  }

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── ICO wrapper (embeds a PNG) ─────────────────────────────────────────
function makeICO(png, size) {
  const hdr = Buffer.alloc(6);
  hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir[0] = size >= 256 ? 0 : size;
  dir[1] = size >= 256 ? 0 : size;
  dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(22, 12); // offset = 6 (header) + 16 (dir entry)
  return Buffer.concat([hdr, dir, png]);
}

// ── Render the "e" icon ────────────────────────────────────────────────
function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const BG = [232, 97, 45];    // #e8612d
  const FG = [26, 26, 46];     // #1a1a2e

  const cx = size * 0.5;
  const cy = size * 0.5;
  const R  = size * 0.34;      // outer ring radius
  const T  = R   * 0.30;      // ring stroke thickness
  const bH = T   * 0.60;      // half-height of middle bar
  const cr = size * 0.22;     // corner radius for background rect

  function inRoundRect(x, y) {
    const ix = x < cr ? cr : x > size - cr ? size - cr : null;
    const iy = y < cr ? cr : y > size - cr ? size - cr : null;
    if (ix !== null && iy !== null)
      return (x - ix) ** 2 + (y - iy) ** 2 <= cr * cr;
    return true;
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const sx = px + 0.5, sy = py + 0.5;

      if (!inRoundRect(sx, sy)) { pixels[idx+3] = 0; continue; }

      const dx   = sx - cx;
      const dy   = sy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ang  = Math.atan2(dy, dx);

      // Smooth ring alpha
      const aOuter = Math.min(1, Math.max(0, R - dist + 0.5));
      const aInner = Math.min(1, Math.max(0, dist - (R - T) + 0.5));
      const ringA  = Math.min(aOuter, aInner);

      // Opening: right side, ±52° from horizontal
      const openAng = Math.PI * 0.29; // ~52°
      const inOpening = Math.abs(ang) < openAng && dist > R - T - 0.5;

      // Middle bar: horizontal stroke extending to 65% of right side
      const inBarX = dx >= -R - 0.5 && dx <= R * 0.65;
      const inBarY = Math.abs(dy) < bH + 0.5;
      const barA   = inBarX && inBarY && dist < R + 0.5
        ? Math.min(1, Math.max(0, bH - Math.abs(dy) + 0.5))
        : 0;

      const alpha = Math.min(1, (inOpening ? 0 : ringA) + barA);

      pixels[idx]   = Math.round(BG[0] + (FG[0] - BG[0]) * alpha);
      pixels[idx+1] = Math.round(BG[1] + (FG[1] - BG[1]) * alpha);
      pixels[idx+2] = Math.round(BG[2] + (FG[2] - BG[2]) * alpha);
      pixels[idx+3] = 255;
    }
  }
  return pixels;
}

const png32  = makePNG(32,  32,  renderIcon(32));
const png180 = makePNG(180, 180, renderIcon(180));

fs.writeFileSync('public/favicon.ico',          makeICO(png32, 32));
fs.writeFileSync('public/apple-touch-icon.png', png180);
console.log('✓ public/favicon.ico (32×32)');
console.log('✓ public/apple-touch-icon.png (180×180)');
