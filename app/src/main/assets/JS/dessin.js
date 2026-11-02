/*
 * Dessins : Fioles d'Ambre
 * Dessine les fioles. Le verre est Picts/fiole.png. Le bouchon est Picts/bouchon.png.
 * La melasse est dessinee dessous. Les mots sont dans textes.js.
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 * Avant une modification : Lire JS/doctrine.js
 */

import { CAPACITY, MELASSES } from "./regle.js";
import { textes } from "./textes.js";
const vialUrl = new URL("../Picts/fiole.png", import.meta.url).href;
const corkUrl = new URL("../Picts/bouchon.png", import.meta.url).href;
const INK = "#140e16";
const LAMP = "#e7a24a";
const PARCHMENT = "#f6ecdf";
function layoutVials(count, w, h) {
  const rows = count > 6 ? 2 : 1;
  const cols = Math.ceil(count / rows);
  const padX = 14;
  const padY = 16;
  const slotW = (w - padX * 2) / cols;
  const slotH = (h - padY * 2) / rows;
  let vialW = Math.min(slotW * 0.98, 150);
  let vialH = vialW * 2;
  if (vialH > slotH * 0.96) {
    vialH = slotH * 0.96;
    vialW = vialH / 2;
  }
  const out = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = Math.min(cols, count - row * cols);
    const rowWidth = inRow * slotW;
    const originX = (w - rowWidth) / 2;
    out.push({
      index: i,
      x: originX + col * slotW + slotW / 2,
      y: padY + row * slotH + (slotH - vialH) / 2,
      w: vialW,
      h: vialH
    });
  }
  return out;
}
function hitTest(layouts, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const v of layouts) {
    const hitW = Math.max(v.w + 18, 48);
    const hitH = v.h + 28;
    if (Math.abs(x - v.x) > hitW / 2) continue;
    if (y < v.y - 20 || y > v.y + hitH) continue;
    const d = Math.abs(x - v.x);
    if (d < bestD) {
      bestD = d;
      best = v.index;
    }
  }
  return best;
}
function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}
function drawScene(ctx, w, h, frame) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  const lamp = ctx.createRadialGradient(w * 0.5, h * 0.08, 10, w * 0.5, h * 0.2, w * 0.7);
  lamp.addColorStop(0, "rgba(231,162,74,0.22)");
  lamp.addColorStop(0.45, "rgba(196,55,90,0.05)");
  lamp.addColorStop(1, "rgba(20,14,22,0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, w, h);
  const side = ctx.createRadialGradient(w * 0.15, h * 0.8, 10, w * 0.2, h * 0.7, w * 0.45);
  side.addColorStop(0, "rgba(31,154,108,0.07)");
  side.addColorStop(1, "rgba(20,14,22,0)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, w, h);
  const layouts = layoutVials(frame.slugs.length, w, h);
  const lift = 14;
  for (const box of layouts) {
    const selected = frame.selected === box.index;
    const dy = selected ? -lift : 0;
    const sx = frame.shakeIndex === box.index ? Math.sin(frame.shakeP * 18) * 7 * frame.shakeP : 0;
    ctx.save();
    ctx.translate(sx, dy);
    const hinted = frame.hint !== null && (frame.hint.from === box.index || frame.hint.to === box.index);
    drawVial(ctx, box, frame.slugs[box.index] ?? [], {
      sealed: frame.sealed[box.index] ?? false,
      selected,
      hinted,
      time: frame.time,
      cork: frame.corkIndex === box.index && frame.corkP !== null ? frame.corkP : frame.sealed[box.index] ? 1 : 0
    });
    ctx.restore();
  }
  if (frame.stream) {
    const a = layouts[frame.stream.from];
    const b = layouts[frame.stream.to];
    if (a && b) drawStream(ctx, a, b, frame.stream.color, frame.stream.p, frame.time, frame.selected);
  }
  if (frame.won) {
    const motes = 14;
    for (let i = 0; i < motes; i++) {
      const p = (frame.time * 0.07 + i / motes) % 1;
      const fade = Math.sin(p * Math.PI);
      const x = (i * 97 % 100) / 100 * w;
      const y = h * (0.92 - p * 0.55);
      ctx.globalAlpha = 0.35 * fade;
      ctx.fillStyle = i % 2 === 0 ? LAMP : "#ff9ab4";
      ctx.beginPath();
      ctx.arc(x, y, 1.6 + (i % 3) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  return layouts;
}
function drawStream(ctx, a, b, color, p, time, selected) {
  const ink = MELASSES[color] ?? MELASSES[0];
  const shown = 0.25 + 0.75 * Math.min(1, Math.max(0, p));
  const x1 = a.x;
  const y1 = a.y + a.h * 0.095 + (selected === a.index ? -14 : 0);
  const x2 = b.x;
  const y2 = b.y + b.h * 0.1 + (selected === b.index ? -14 : 0);
  const gap = Math.abs(x2 - x1);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + 14 + gap * 0.22 + Math.sin(time * 2) * 1.4;
  const steps = 18;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2;
    const y = u * u * y1 + 2 * u * t * cy + t * t * y2;
    const dx = 2 * u * (cx - x1) + 2 * t * (x2 - cx);
    const dy = 2 * u * (cy - y1) + 2 * t * (y2 - cy);
    const len = Math.hypot(dx, dy) || 1;
    const belly = Math.sin(t * Math.PI);
    const w = Math.max(a.w, b.w) * 0.05 * (0.5 + belly);
    pts.push({ x, y, nx: -dy / len, ny: dx / len, w });
  }
  const ribbon = (scale) => {
    ctx.beginPath();
    const first = pts[0];
    ctx.moveTo(first.x + first.nx * first.w * scale, first.y + first.ny * first.w * scale);
    for (const q of pts) ctx.lineTo(q.x + q.nx * q.w * scale, q.y + q.ny * q.w * scale);
    for (let i = pts.length - 1; i >= 0; i--) {
      const q = pts[i];
      ctx.lineTo(q.x - q.nx * q.w * scale, q.y - q.ny * q.w * scale);
    }
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha = 0.94 * shown;
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, ink.light);
  g.addColorStop(0.42, ink.fill);
  g.addColorStop(1, ink.deep);
  ribbon(1);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = 0.38 * shown;
  ribbon(0.34);
  ctx.fillStyle = ink.light;
  ctx.fill();
  const start = pts[0];
  const end = pts[pts.length - 1];
  ctx.globalAlpha = 0.9 * shown;
  ctx.fillStyle = ink.fill;
  ctx.beginPath();
  ctx.ellipse(start.x, start.y, start.w * 0.85, start.w * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink.deep;
  ctx.beginPath();
  ctx.ellipse(end.x, end.y, end.w * 1.2, end.w * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
const INNER_L = 164 / 512;
const INNER_R = 347 / 512;
const INNER_T = 156 / 1024;
const INNER_B = 928 / 1024;
let vialImg = null;
let corkImg = null;
function loadImage(src, slot) {
  if (typeof Image === "undefined") return null;
  if (!slot.img) {
    const img = new Image();
    img.src = src;
    slot.img = img;
  }
  return slot.img.complete && slot.img.naturalWidth > 0 ? slot.img : null;
}
function vialImage() {
  const box = { img: vialImg };
  const img = loadImage(vialUrl, box);
  vialImg = box.img;
  return img;
}
function corkImage() {
  const box = { img: corkImg };
  const img = loadImage(corkUrl, box);
  corkImg = box.img;
  return img;
}
function liquidBox(box) {
  const leftEdge = box.x - box.w / 2;
  return {
    left: leftEdge + box.w * INNER_L,
    right: leftEdge + box.w * INNER_R,
    top: box.y + box.h * INNER_T,
    bottom: box.y + box.h * INNER_B
  };
}
function liquidPath(ctx, inner) {
  const r = (inner.right - inner.left) / 2;
  const cx = (inner.left + inner.right) / 2;
  const bowl = inner.bottom - r;
  ctx.beginPath();
  ctx.moveTo(inner.left, inner.top);
  ctx.lineTo(inner.left, Math.max(inner.top, bowl));
  ctx.arc(cx, Math.max(inner.top, bowl), r, Math.PI, 0, true);
  ctx.lineTo(inner.right, inner.top);
  ctx.closePath();
}
function drawVial(ctx, box, slugs, style) {
  const img = vialImage();
  const dx = box.x - box.w / 2;
  if (style.selected || style.hinted) {
    ctx.save();
    ctx.shadowColor = style.selected ? "rgba(231,162,74,0.85)" : "rgba(231,162,74,0.45)";
    ctx.shadowBlur = style.selected ? 22 : 12;
    if (img) ctx.drawImage(img, dx, box.y, box.w, box.h);
    else {
      ctx.fillStyle = "rgba(231,162,74,0.2)";
      ctx.fillRect(dx, box.y, box.w, box.h);
    }
    ctx.restore();
  }
  const inner = liquidBox(box);
  ctx.save();
  liquidPath(ctx, inner);
  ctx.clip();
  const innerH = inner.bottom - inner.top;
  const slot = innerH / CAPACITY;
  let yCursor = inner.bottom;
  const bands = bandsOf(slugs);
  for (let i = 0; i < bands.length; i++) {
    const slug = bands[i];
    const segH = slot * slug.h;
    const y = yCursor - segH;
    const isTop = i === bands.length - 1;
    drawSlug(ctx, inner.left, y, inner.right - inner.left, segH, slug, isTop);
    yCursor = y;
  }
  const shade = ctx.createLinearGradient(inner.left, 0, inner.right, 0);
  shade.addColorStop(0, "rgba(255,255,255,0.2)");
  shade.addColorStop(0.16, "rgba(255,255,255,0.05)");
  shade.addColorStop(0.62, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(40,16,28,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(inner.left, inner.top, inner.right - inner.left, innerH);
  ctx.restore();
  // Sous le verre. Un peu plus haut que le buvant, un peu plus long que l'image.
  if (style.cork > 0.01) {
    const t = easeOut(Math.min(1, style.cork));
    const imgW = box.w * 0.54;
    const imgH = imgW * 0.62;
    const y = box.y + (1 - t) * -box.h * 0.08;
    const cork = corkImage();
    if (cork) {
      ctx.drawImage(cork, box.x - imgW / 2, y, imgW, imgH);
    } else {
      const corkW = box.w * 0.36;
      const corkH = Math.max(8, box.h * 0.05);
      ctx.save();
      ctx.fillStyle = "#c4a574";
      roundRect(ctx, box.x - corkW / 2, y, corkW, corkH, 6);
      ctx.fill();
      ctx.restore();
    }
  }
  if (img) {
    ctx.drawImage(img, dx, box.y, box.w, box.h);
  } else {
    ctx.strokeStyle = "rgba(246,236,223,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + box.w * 0.2, box.y + box.h * 0.08, box.w * 0.6, box.h * 0.86);
  }
  if (style.selected) {
    ctx.fillStyle = PARCHMENT;
    ctx.globalAlpha = 0.8;
    ctx.font = "12px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(textes.verse, box.x, box.y + box.h + 16);
    ctx.globalAlpha = 1;
  }
}
function bandsOf(slugs) {
  const out = [];
  for (const slug of slugs) {
    const last = out[out.length - 1];
    if (last && last.hidden && slug.hidden) {
      last.h += slug.h;
    } else if (last && !last.hidden && !slug.hidden && last.color === slug.color) {
      last.h += slug.h;
    } else {
      out.push({ color: slug.color, hidden: slug.hidden, h: slug.h });
    }
  }
  return out;
}
function drawSlug(ctx, x, y, w, h, slug, isTop) {
  if (slug.hidden) {
    const g2 = ctx.createLinearGradient(x, y, x, y + h);
    g2.addColorStop(0, "rgba(150, 132, 160, 0.96)");
    g2.addColorStop(1, "rgba(58, 42, 70, 0.98)");
    ctx.fillStyle = g2;
    ctx.fillRect(x, y - 1, w, h + 2);
    return;
  }
  const ink = MELASSES[slug.color] ?? MELASSES[0];
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, ink.light);
  g.addColorStop(0.22, ink.fill);
  g.addColorStop(1, ink.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 1, w, h + 2);
  if (!isTop) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = ink.deep;
    ctx.fillRect(x, y, w, 2);
    ctx.globalAlpha = 1;
  } else {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ink.light;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + Math.max(2, h * 0.08), w * 0.4, Math.max(2.5, h * 0.07), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
export {
  drawScene,
  hitTest,
  layoutVials
};
