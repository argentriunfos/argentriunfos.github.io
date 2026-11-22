// Ornamentos de fileteado porteño generados en SVG (volutas, hojas, flores, guardas).
// Todo se dibuja por código: sin imágenes externas y en cualquier tamaño.

export const PALETA = {
  negro: '#141210',
  crema: '#f3e6c8',
  rojo: '#c8102e',
  rojoLuz: '#ff7a7a',
  verde: '#1f7a3a',
  verdeLuz: '#8fe0a0',
  celeste: '#4aa3df',
  celesteLuz: '#c8ecff',
  oro: '#f2b705',
  oroLuz: '#fff1a8',
  azul: '#1d3f8f',
  azulLuz: '#9db8ff',
};

const f = (n) => n.toFixed(1);

// Espiral logarítmica que arranca en (cx + r0·cos a0, cy + r0·sin a0) y se enrosca hacia el centro.
function espiral(cx, cy, r0, a0, vueltas, sentido = 1, rFin = 2.5) {
  const pts = [];
  const total = vueltas * Math.PI * 2;
  const k = Math.log(r0 / rFin) / total;
  for (let i = 0; i <= 90; i++) {
    const t = (i / 90) * total;
    const r = r0 * Math.exp(-k * t);
    const a = a0 + sentido * t;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
const linea = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');

// Trazo "fileteado": contorno negro, color y una luz fina encima (como el pincel de filetear).
function trazo(d, color, luz, ancho = 7) {
  return `<path d="${d}" fill="none" stroke="${PALETA.negro}" stroke-width="${ancho + 3}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${luz}" stroke-width="${Math.max(1.2, ancho / 4)}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
}

// Hoja de acanto simplificada: gota con nervio de luz.
function hoja(x, y, largo, ang, color, luz) {
  const a = (ang * Math.PI) / 180;
  const ex = x + largo * Math.cos(a), ey = y + largo * Math.sin(a);
  const nx = -Math.sin(a) * largo * 0.62, ny = Math.cos(a) * largo * 0.62;
  const mx = (x + ex) / 2, my = (y + ey) / 2;
  const d = `M${f(x)} ${f(y)} Q${f(mx + nx)} ${f(my + ny)} ${f(ex)} ${f(ey)} Q${f(mx - nx * 0.3)} ${f(my - ny * 0.3)} ${f(x)} ${f(y)}Z`;
  return `<path d="${d}" fill="${color}" stroke="${PALETA.negro}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M${f(x + (ex - x) * 0.15)} ${f(y + (ey - y) * 0.15)} Q${f(mx + nx * 0.35)} ${f(my + ny * 0.35)} ${f(x + (ex - x) * 0.8)} ${f(y + (ey - y) * 0.8)}" fill="none" stroke="${luz}" stroke-width="1.6" stroke-linecap="round"/>`;
}

// Flor de cinco pétalos con centro dorado.
function flor(x, y, r, color, luz) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = x + r * 0.62 * Math.cos(a), py = y + r * 0.62 * Math.sin(a);
    s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.48)}" fill="${color}" stroke="${PALETA.negro}" stroke-width="2.2"/>`;
    s += `<circle cx="${f(px - r * 0.12)}" cy="${f(py - r * 0.12)}" r="${f(r * 0.14)}" fill="${luz}"/>`;
  }
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.36)}" fill="${PALETA.oro}" stroke="${PALETA.negro}" stroke-width="2.2"/>`;
  s += `<circle cx="${f(x - r * 0.1)}" cy="${f(y - r * 0.1)}" r="${f(r * 0.1)}" fill="${PALETA.oroLuz}"/>`;
  return s;
}

const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;

// ── Esquina: dos volutas que salen de una flor y corren por los bordes ──
export function esquina() {
  const P = PALETA;
  // Voluta horizontal (roja): tallo por arriba que termina enroscándose hacia abajo.
  const espH = espiral(122, 36, 27, -Math.PI / 2, 1.6, 1);
  const tallo = `M22 20 Q70 4 ${f(espH[0][0])} ${f(espH[0][1])}`;
  const dH = tallo + ' L' + espH.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  // Voluta vertical (celeste): espejo sobre la diagonal.
  const espV = espiral(36, 122, 27, Math.PI, 1.6, -1);
  const dV = `M20 22 Q4 70 ${f(espV[0][0])} ${f(espV[0][1])} L` + espV.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  // Volutitas internas (verde) que acompañan.
  const espH2 = espiral(78, 52, 12, Math.PI, 1.3, 1);
  const espV2 = espiral(52, 78, 12, -Math.PI / 2, 1.3, -1);
  const body =
    trazo(dH, P.rojo, P.rojoLuz, 7) +
    trazo(dV, P.celeste, P.celesteLuz, 7) +
    trazo(`M34 34 Q50 38 ${f(espH2[0][0])} ${f(espH2[0][1])} L` + espH2.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'), P.verde, P.verdeLuz, 4.5) +
    trazo(`M34 34 Q38 50 ${f(espV2[0][0])} ${f(espV2[0][1])} L` + espV2.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'), P.verde, P.verdeLuz, 4.5) +
    hoja(62, 14, 30, 25, P.verde, P.verdeLuz) +
    hoja(14, 62, 30, 65, P.verde, P.verdeLuz) +
    hoja(149, 38, 20, 80, P.oro, P.oroLuz) +
    hoja(38, 149, 20, 10, P.oro, P.oroLuz) +
    flor(24, 24, 18, P.rojo, P.rojoLuz);
  return svg(170, 170, body);
}

// ── Guarda horizontal: flor central con volutas hacia ambos lados ──
export function guarda() {
  const P = PALETA;
  const espD = espiral(250, 30, 18, -Math.PI / 2, 1.5, 1);
  const espI = espiral(70, 30, 18, -Math.PI / 2, 1.5, -1);
  const dD = `M170 26 Q205 8 ${f(espD[0][0])} ${f(espD[0][1])} L` + espD.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  const dI = `M150 26 Q115 8 ${f(espI[0][0])} ${f(espI[0][1])} L` + espI.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  const espD2 = espiral(205, 44, 9, Math.PI / 2, 1.3, -1);
  const espI2 = espiral(115, 44, 9, Math.PI / 2, 1.3, 1);
  const body =
    trazo(dD, P.rojo, P.rojoLuz, 5.5) + trazo(dI, P.rojo, P.rojoLuz, 5.5) +
    trazo(`M172 36 Q190 52 ${f(espD2[0][0])} ${f(espD2[0][1])} L` + espD2.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'), P.celeste, P.celesteLuz, 4) +
    trazo(`M148 36 Q130 52 ${f(espI2[0][0])} ${f(espI2[0][1])} L` + espI2.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'), P.celeste, P.celesteLuz, 4) +
    hoja(268, 32, 26, 10, P.verde, P.verdeLuz) + hoja(52, 32, 26, 170, P.verde, P.verdeLuz) +
    hoja(176, 22, 18, -40, P.verde, P.verdeLuz) + hoja(144, 22, 18, -140, P.verde, P.verdeLuz) +
    flor(160, 30, 15, P.rojo, P.rojoLuz);
  return svg(320, 64, body);
}

// ── Estrellita de cuatro puntas (brillo del filete) ──
export function brillo(color = PALETA.oro) {
  return svg(40, 40, `<path d="M20 2 Q23 17 38 20 Q23 23 20 38 Q17 23 2 20 Q17 17 20 2Z" fill="${color}" stroke="${PALETA.negro}" stroke-width="2"/>`);
}

// ── Sol de Mayo simple para el favicon alternativo / detalles ──
export function sol(color = PALETA.oro) {
  let rays = '';
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI * 2) / 32, r2 = i % 2 ? 41 : 48;
    rays += `<line x1="${f(50 + 30 * Math.cos(a))}" y1="${f(50 + 30 * Math.sin(a))}" x2="${f(50 + r2 * Math.cos(a))}" y2="${f(50 + r2 * Math.sin(a))}"/>`;
  }
  return svg(100, 100, `<g stroke="${color}" stroke-width="3" stroke-linecap="round">${rays}</g><circle cx="50" cy="50" r="24" fill="${color}"/>`);
}
