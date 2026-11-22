// Gera os ícones PNG do PWA HERUPU sem dependências externas.
// Desenha um "H" branco sobre um gradiente índigo -> violeta.
// Uso: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');

// ---- Helpers de cor / desenho ----
function lerp(a, b, t) { return a + (b - a) * t; }
function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
const TOP = hex('#4F46E5');    // indigo-600
const BOTTOM = hex('#9333EA'); // violet-600
const WHITE = [255, 255, 255];

// Anti-aliased rounded-rect membership: retorna cobertura 0..1
function roundedRectCoverage(x, y, w, h, r, px, py) {
  // distância ao retângulo arredondado (assinada), suavizada em ~1px
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx, dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) - r;
  return Math.min(Math.max(0.5 - dist, 0), 1);
}

// Cobertura de um retângulo simples com AA
function rectCoverage(x, y, w, h, px, py) {
  const inX = Math.min(px + 1, x + w) - Math.max(px, x);
  const inY = Math.min(py + 1, y + h) - Math.max(py, y);
  if (inX <= 0 || inY <= 0) return 0;
  return Math.min(inX, 1) * Math.min(inY, 1);
}

function drawIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  // Padding do fundo: maskable precisa preencher tudo (SO recorta), normal tem cantos arredondados.
  const pad = maskable ? 0 : Math.round(size * 0.0); // fundo full-bleed; cantos via raio
  const bx = pad, by = pad, bw = size - pad * 2, bh = size - pad * 2;
  const radius = maskable ? 0 : Math.round(size * 0.22);

  // Geometria do "H" — menor na versão maskable (zona de segurança ~80%).
  const glyphScale = maskable ? 0.46 : 0.56;
  const gh = size * glyphScale;              // altura do H
  const gw = gh * 0.82;                       // largura do H
  const gx = (size - gw) / 2;
  const gy = (size - gh) / 2;
  const bar = gw * 0.26;                       // espessura das hastes
  const crossH = gh * 0.20;                    // espessura da barra central
  const crossY = gy + (gh - crossH) / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const t = py / (size - 1);
      let r = lerp(TOP[0], BOTTOM[0], t);
      let g = lerp(TOP[1], BOTTOM[1], t);
      let b = lerp(TOP[2], BOTTOM[2], t);

      // brilho diagonal sutil
      const glow = 1 - Math.min(1, (px + py) / (size * 2)) * 0.10;
      r *= glow; g *= glow; b *= glow;

      // fundo (alpha via rounded rect)
      const bgA = roundedRectCoverage(bx, by, bw, bh, radius, px + 0.5, py + 0.5);

      // letra H (união de 3 retângulos)
      let hA = 0;
      hA = Math.max(hA, rectCoverage(gx, gy, bar, gh, px, py));                    // haste esquerda
      hA = Math.max(hA, rectCoverage(gx + gw - bar, gy, bar, gh, px, py));         // haste direita
      hA = Math.max(hA, rectCoverage(gx, crossY, gw, crossH, px, py));            // barra central

      // compõe: branco por cima do gradiente
      let fr = r, fg = g, fb = b;
      if (hA > 0) {
        fr = lerp(r, WHITE[0], hA);
        fg = lerp(g, WHITE[1], hA);
        fb = lerp(b, WHITE[2], hA);
      }

      const i = (py * size + px) * 4;
      buf[i] = Math.round(fr);
      buf[i + 1] = Math.round(fg);
      buf[i + 2] = Math.round(fb);
      buf[i + 3] = Math.round(bgA * 255);
    }
  }
  return buf;
}

// ---- Codificador PNG (RGBA, filtro 0) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // raw com byte de filtro 0 por linha
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function write(name, size, opts) {
  const png = encodePNG(size, drawIcon(size, opts));
  fs.writeFileSync(path.join(OUT, name), png);
  console.log('gerado', name, `(${size}x${size}, ${png.length} bytes)`);
}

fs.mkdirSync(OUT, { recursive: true });
write('icon-192.png', 192, {});
write('icon-512.png', 512, {});
write('icon-maskable-192.png', 192, { maskable: true });
write('icon-maskable-512.png', 512, { maskable: true });
write('apple-touch-icon.png', 180, { maskable: true }); // iOS recorta em rounded rect
write('favicon-32.png', 32, {});
console.log('OK');
