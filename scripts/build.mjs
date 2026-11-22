// Argentriunfos — generador estático sin dependencias.
// Lee data/triunfos/*.json y genera el sitio completo en dist/.
// Uso: node scripts/build.mjs            (usa "base" de site.config.json)
//      BASE=/ node scripts/build.mjs     (para dominio propio o pruebas locales)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const SITE = readJSON('site.config.json');
const RUBROS = readJSON('data/rubros.json');
const NIVELES = readJSON('data/niveles.json');
const BASE = (process.env.BASE ?? SITE.base).replace(/\/?$/, '/');
const SITE_URL = (process.env.SITE_URL ?? SITE.url).replace(/\/$/, '');
const ABS = (p = '') => SITE_URL + BASE + p;
const U = (p = '') => BASE + p;

// ───────────────────────── Datos y validación ─────────────────────────
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FECHA_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const errores = [];

const triunfos = fs.readdirSync(path.join(ROOT, 'data/triunfos'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const t = readJSON('data/triunfos/' + f);
    const e = (m) => errores.push(`${f}: ${m}`);
    if (t.id !== f.replace(/\.json$/, '')) e(`"id" (${t.id}) debe coincidir con el nombre del archivo`);
    if (!/^[a-z0-9-]+$/.test(t.id || '')) e('"id" solo puede tener minúsculas, números y guiones');
    for (const k of ['titulo', 'fecha', 'rubro', 'resumen', 'nivel']) if (!t[k]) e(`falta "${k}"`);
    if (t.fecha && !FECHA_RE.test(t.fecha)) e('"fecha" debe ser AAAA, AAAA-MM o AAAA-MM-DD');
    if (t.rubro && !RUBROS[t.rubro]) e(`rubro desconocido "${t.rubro}" (ver data/rubros.json)`);
    if (t.nivel && !NIVELES[String(t.nivel)]) e('"nivel" debe ser 1, 2, 3 o 4');
    if (!['historico', 'noticia'].includes(t.tipo)) e('"tipo" debe ser "historico" o "noticia"');
    if (!Array.isArray(t.fuentes) || !t.fuentes.length || t.fuentes.some((x) => !/^https?:\/\//.test(x.url || ''))) e('necesita al menos una fuente con "url"');
    t.contenido ??= [];
    t.protagonistas ??= [];
    t.etiquetas ??= [];
    t.verificacion ??= { estado: 'en_revision' };
    t.publicado ??= t.fecha;
    return t;
  })
  // Solo se publica lo verificado. Lo "en_revision" queda en el repo pero no sale en la web.
  .filter((t) => t.verificacion.estado === 'verificado')
  .sort((a, b) => b.fecha.localeCompare(a.fecha));

if (errores.length) {
  console.error('❌ Errores en los datos:\n  ' + errores.join('\n  '));
  process.exit(1);
}

const noticias = triunfos.filter((t) => t.tipo === 'noticia').sort((a, b) => b.publicado.localeCompare(a.publicado) || b.fecha.localeCompare(a.fecha));
const anio = (t) => +t.fecha.slice(0, 4);

// ───────────────────────── Helpers ─────────────────────────
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fechaLarga(f) {
  const [y, m, d] = f.split('-');
  if (d) return `${+d} de ${MESES[+m - 1]} de ${y}`;
  if (m) return `${MESES[+m - 1]} de ${y}`;
  return y;
}
const sol = (cls = '') => {
  let rays = '';
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI * 2) / 32, long = i % 2 === 0;
    const r1 = 30, r2 = long ? 48 : 41;
    rays += `<line x1="${(50 + r1 * Math.cos(a)).toFixed(2)}" y1="${(50 + r1 * Math.sin(a)).toFixed(2)}" x2="${(50 + r2 * Math.cos(a)).toFixed(2)}" y2="${(50 + r2 * Math.sin(a)).toFixed(2)}"/>`;
  }
  return `<svg class="sol ${cls}" viewBox="0 0 100 100" aria-hidden="true"><g stroke="currentColor" stroke-width="3" stroke-linecap="round">${rays}</g><circle cx="50" cy="50" r="24" fill="currentColor"/></svg>`;
};
const write = (rel, content) => {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};

const nivelBadge = (n) => `<span class="nivel nivel-${n}" title="${esc(NIVELES[n].descripcion)}">${'★'.repeat(5 - n)} ${esc(NIVELES[n].nombre)}</span>`;
const rubroBadge = (r) => `<a class="rubro-tag" href="${U('rubro/' + r + '/')}">${RUBROS[r].emoji} ${esc(RUBROS[r].nombre)}</a>`;

function card(t) {
  return `<article class="card nivel-borde-${t.nivel}" data-rubro="${t.rubro}" data-anio="${anio(t)}" data-nivel="${t.nivel}" data-tipo="${t.tipo}" data-texto="${esc([t.titulo, t.resumen, t.disciplina, ...t.protagonistas, ...t.etiquetas, t.lugar].join(' ').toLowerCase())}">
  <div class="card-top">${rubroBadge(t.rubro)}<span class="card-fecha">${esc(fechaLarga(t.fecha))}</span></div>
  <h3><a href="${U('triunfo/' + t.id + '/')}">${esc(t.titulo)}</a></h3>
  <p>${esc(t.resumen)}</p>
  <div class="card-bottom">${nivelBadge(t.nivel)}<span class="verif" title="Verificado con ${t.fuentes.length} fuente(s)">✔ Verificado</span></div>
</article>`;
}

function layout({ title, description, rel, body, jsonld, ogType = 'website' }) {
  const fullTitle = title ? `${title} | ${SITE.nombre}` : `${SITE.nombre} — ${SITE.lema}`;
  const desc = description || SITE.descripcion;
  const redes = Object.entries(SITE.redes).filter(([, v]) => v);
  return `<!DOCTYPE html>
<html lang="${SITE.idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${ABS(rel)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${ABS(rel)}">
<meta property="og:site_name" content="${SITE.nombre}">
<meta property="og:image" content="${ABS('assets/og.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1b33">
<link rel="icon" href="${U('assets/favicon.png')}" type="image/png">
<link rel="apple-touch-icon" href="${U('assets/apple-touch-icon.png')}">
<link rel="alternate" type="application/rss+xml" title="${SITE.nombre}" href="${U('feed.xml')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${U('assets/style.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header class="top">
  <a class="logo" href="${U()}"><img src="${U('assets/logo-128.webp')}" alt="" width="44" height="44"><span>ARGENTRIUNFOS</span></a>
  <nav>
    <a href="${U('noticias/')}">Noticias</a>
    <a href="${U('archivo/')}">Archivo</a>
    <a href="${U('sobre/')}">Cómo verificamos</a>
  </nav>
</header>
<main>
${body}
</main>
<footer class="pie">
  <div class="franja"></div>
  <div class="pie-inner">
    <div><img class="pie-logo" src="${U('assets/logo-128.webp')}" alt="Logo de Argentriunfos" width="64" height="64"><strong>ARGENTRIUNFOS</strong><br><span>${esc(SITE.lema)}</span></div>
    <div class="pie-links">
      <a href="${U('archivo/')}">Archivo completo</a>
      ${Object.keys(RUBROS).map((r) => `<a href="${U('rubro/' + r + '/')}">${esc(RUBROS[r].nombre)}</a>`).join('\n      ')}
    </div>
    <div class="pie-links">
      ${redes.map(([k, v]) => `<a href="${esc(v)}" rel="me noopener" target="_blank">${k[0].toUpperCase() + k.slice(1)}</a>`).join('\n      ')}
      <a href="${U('feed.xml')}">RSS</a>
      <a href="${U('triunfos.json')}">Datos abiertos (JSON)</a>
    </div>
  </div>
  <p class="legal">Cada triunfo publicado tiene fuentes verificables. ¿Encontraste un error o falta un triunfo? Escribinos por redes.</p>
</footer>
<script src="${U('assets/app.js')}" defer></script>
</body>
</html>`;
}

// ───────────────────────── Páginas ─────────────────────────
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'), { recursive: true });
write('.nojekyll', '');

const porRubro = Object.fromEntries(Object.keys(RUBROS).map((r) => [r, triunfos.filter((t) => t.rubro === r)]));
const anios = [...new Set(triunfos.map(anio))];
const decadas = [...new Set(triunfos.map((t) => Math.floor(anio(t) / 10) * 10))].sort((a, b) => b - a);

// Datos compactos para el "Un día como hoy" y el buscador.
const mini = triunfos.map((t) => ({ id: t.id, titulo: t.titulo, fecha: t.fecha, rubro: t.rubro, nivel: t.nivel }));

// HOME
{
  const destacados = triunfos.filter((t) => t.nivel === 1 && t.tipo === 'historico').slice(0, 6);
  const body = `
<section class="hero">
  <img class="hero-logo" src="${U('assets/logo.webp')}" alt="Logo de Argentriunfos: un titanosaurio con la bandera argentina" width="640" height="640">
  <div class="hero-inner">
    <p class="kicker">El registro verificado de la grandeza argentina</p>
    <h1>CADA TRIUNFO<br><span>ES DE TODOS</span></h1>
    <p class="hero-sub">Del Mundial a la NASA, del Nobel a un torneo de Pokémon. Si un argentino gana en el mundo, acá queda registrado. Con fuentes.</p>
    <div class="hero-cta">
      <a class="btn btn-oro" href="${U('archivo/')}">Explorar el archivo</a>
      <a class="btn btn-linea" href="${U('noticias/')}">Últimos triunfos</a>
    </div>
    <div class="contadores">
      <div><strong>${triunfos.length}</strong><span>triunfos verificados</span></div>
      <div><strong>${Object.values(porRubro).filter((x) => x.length).length}</strong><span>rubros</span></div>
      <div><strong>${Math.min(...anios)}–${Math.max(...anios)}</strong><span>años de historia</span></div>
    </div>
  </div>
</section>

<section class="bloque" id="hoy" hidden>
  <h2 class="titulo-seccion">Un día como hoy</h2>
  <div class="grid" id="hoy-lista"></div>
</section>

<section class="bloque">
  <div class="seccion-head"><h2 class="titulo-seccion">Últimos triunfos</h2><a href="${U('noticias/')}">Ver todos →</a></div>
  <div class="grid">${[...noticias, ...triunfos.filter((t) => t.tipo !== 'noticia')].slice(0, 6).map(card).join('\n')}</div>
</section>

<section class="bloque">
  <h2 class="titulo-seccion">Por rubro</h2>
  <div class="rubros-grid">
    ${Object.entries(RUBROS).map(([k, r]) => `<a class="rubro-box" href="${U('rubro/' + k + '/')}"><span class="emoji">${r.emoji}</span><strong>${esc(r.nombre)}</strong><span>${porRubro[k].length ? `${porRubro[k].length} triunfo${porRubro[k].length === 1 ? '' : 's'}` : 'Próximamente'}</span></a>`).join('\n    ')}
  </div>
</section>

<section class="bloque">
  <div class="seccion-head"><h2 class="titulo-seccion">Hazañas históricas</h2><a href="${U('archivo/?nivel=1')}">Ver todas →</a></div>
  <div class="grid">${destacados.map(card).join('\n')}</div>
</section>
<script id="datos-mini" type="application/json">${JSON.stringify(mini)}</script>
<script>window.ARG_BASE=${JSON.stringify(BASE)};</script>`;
  write('index.html', layout({ rel: '', body, jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.nombre, url: ABS(), description: SITE.descripcion, inLanguage: SITE.idioma } }));
}

// ARCHIVO
{
  const body = `
<section class="cabecera">
  <h1>Archivo de triunfos</h1>
  <p>Todos los triunfos argentinos verificados, filtrables por rubro, década y nivel de importancia.</p>
</section>
<section class="bloque">
  <form class="filtros" id="filtros" onsubmit="return false">
    <input type="search" id="f-texto" placeholder="Buscar: Messi, Nobel, hockey, Pokémon…" aria-label="Buscar">
    <select id="f-rubro" aria-label="Rubro"><option value="">Todos los rubros</option>${Object.entries(RUBROS).map(([k, r]) => `<option value="${k}">${r.emoji} ${esc(r.nombre)}</option>`).join('')}</select>
    <select id="f-decada" aria-label="Década"><option value="">Todas las décadas</option>${decadas.map((d) => `<option value="${d}">${d}s</option>`).join('')}</select>
    <select id="f-nivel" aria-label="Nivel"><option value="">Todos los niveles</option>${Object.entries(NIVELES).map(([k, n]) => `<option value="${k}">${'★'.repeat(5 - k)} ${esc(n.nombre)}</option>`).join('')}</select>
  </form>
  <p class="resultado" id="f-resultado">${triunfos.length} triunfos</p>
  <div class="grid" id="archivo-lista">${triunfos.map(card).join('\n')}</div>
</section>`;
  write('archivo/index.html', layout({ title: 'Archivo de triunfos', rel: 'archivo/', body }));
}

// NOTICIAS (blog)
{
  const lista = noticias.length ? noticias : [];
  const body = `
<section class="cabecera">
  <h1>Últimos triunfos</h1>
  <p>Las victorias argentinas más recientes, verificadas antes de publicarse.</p>
</section>
<section class="bloque">
  ${lista.length ? `<div class="grid">${lista.map(card).join('\n')}</div>` : '<p>Muy pronto, los primeros triunfos del día.</p>'}
</section>`;
  write('noticias/index.html', layout({ title: 'Últimos triunfos', rel: 'noticias/', body }));
}

// RUBROS
for (const [k, r] of Object.entries(RUBROS)) {
  const lista = porRubro[k];
  const body = `
<section class="cabecera">
  <p class="kicker">${r.emoji} Rubro</p>
  <h1>${esc(r.nombre)}</h1>
  <p>${esc(r.descripcion)}</p>
</section>
<section class="bloque">
  ${lista.length ? `<div class="grid">${lista.map(card).join('\n')}</div>` : '<p>Todavía no cargamos triunfos en este rubro. ¡Se vienen!</p>'}
</section>`;
  write(`rubro/${k}/index.html`, layout({ title: `Triunfos argentinos en ${r.nombre}`, description: r.descripcion, rel: `rubro/${k}/`, body }));
}

// FICHA DE CADA TRIUNFO
for (const t of triunfos) {
  const url = ABS(`triunfo/${t.id}/`);
  const shareText = encodeURIComponent(`🇦🇷 ${t.titulo}`);
  const relacionados = triunfos.filter((x) => x.id !== t.id && x.rubro === t.rubro).slice(0, 3);
  const body = `
<article class="ficha">
  <header class="ficha-head nivel-fondo-${t.nivel}">
    ${sol('ficha-sol')}
    <div class="ficha-meta">${rubroBadge(t.rubro)}${t.disciplina ? `<span class="disciplina">${esc(t.disciplina)}</span>` : ''}${t.tipo === 'noticia' ? '<span class="chip-noticia">Noticia</span>' : ''}</div>
    <h1>${esc(t.titulo)}</h1>
    <p class="ficha-fecha">📅 ${esc(fechaLarga(t.fecha))}${t.lugar ? ` · 📍 ${esc(t.lugar)}` : ''}</p>
    ${nivelBadge(t.nivel)}
  </header>
  <div class="ficha-cuerpo">
    <p class="bajada">${esc(t.resumen)}</p>
    ${t.contenido.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
    ${t.protagonistas.length ? `<h2>Protagonistas</h2><ul class="chips">${t.protagonistas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    <section class="verificacion">
      <h2>✔ Verificación</h2>
      <p>Estado: <strong>Verificado</strong>${t.verificacion.fecha ? ` el ${esc(fechaLarga(t.verificacion.fecha))}` : ''}.${t.verificacion.nota ? ' ' + esc(t.verificacion.nota) : ''}</p>
      <ol class="fuentes">${t.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener nofollow">${esc(f.titulo || f.url)}</a>${f.medio ? ` — <span>${esc(f.medio)}</span>` : ''}</li>`).join('')}</ol>
    </section>
    <div class="compartir">
      <span>Compartí este triunfo:</span>
      <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}" target="_blank" rel="noopener">WhatsApp</a>
      <a href="https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
    </div>
    ${t.etiquetas.length ? `<p class="etiquetas">${t.etiquetas.map((e) => `<a href="${U('archivo/?q=' + encodeURIComponent(e))}">#${esc(e)}</a>`).join(' ')}</p>` : ''}
  </div>
</article>
${relacionados.length ? `<section class="bloque"><h2 class="titulo-seccion">Más triunfos en ${esc(RUBROS[t.rubro].nombre)}</h2><div class="grid">${relacionados.map(card).join('\n')}</div></section>` : ''}`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': t.tipo === 'noticia' ? 'NewsArticle' : 'Article',
    headline: t.titulo, description: t.resumen, datePublished: t.publicado, inLanguage: SITE.idioma,
    about: t.protagonistas.map((p) => ({ '@type': 'Thing', name: p })),
    citation: t.fuentes.map((f) => f.url), mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: SITE.nombre, url: ABS() },
  };
  write(`triunfo/${t.id}/index.html`, layout({ title: t.titulo, description: t.resumen, rel: `triunfo/${t.id}/`, body, jsonld, ogType: 'article' }));
}

// SOBRE / METODOLOGÍA
{
  const body = `
<section class="cabecera">
  <h1>Cómo verificamos</h1>
  <p>Argentriunfos quiere ser la fuente de referencia de los logros argentinos. Por eso, nada se publica sin verificar.</p>
</section>
<section class="bloque texto">
  <h2>Qué es un triunfo</h2>
  <p>Cualquier logro de una persona o equipo argentino, nacido en el país o argentino por adopción, en cualquier ámbito: deporte, ciencia, cultura, tecnología, esports, educación, gastronomía y más. Desde un Mundial hasta un torneo de Pokémon o una beca en la NASA.</p>
  <h2>Cómo lo verificamos</h2>
  <ol>
    <li><strong>Detección.</strong> Todos los días revisamos medios nacionales, internacionales y especializados en busca de logros argentinos.</li>
    <li><strong>Contraste.</strong> Cada triunfo se confirma en al menos una fuente de referencia (organismo oficial, enciclopedia o medio reconocido). Las noticias nuevas requieren dos fuentes independientes.</li>
    <li><strong>Revisión periodística.</strong> Una periodista revisa cada publicación antes de que salga.</li>
    <li><strong>Transparencia.</strong> Todas las fuentes quedan enlazadas en la ficha de cada triunfo, para que cualquiera pueda comprobarlo.</li>
  </ol>
  <h2>Niveles de importancia</h2>
  <ul class="niveles-lista">${Object.entries(NIVELES).map(([k, n]) => `<li>${nivelBadge(k)} ${esc(n.descripcion)}</li>`).join('')}</ul>
  <h2>Datos abiertos</h2>
  <p>Todo el archivo está disponible en formato JSON en <a href="${U('triunfos.json')}">triunfos.json</a>, libre para usar citando la fuente.</p>
  <h2>¿Falta un triunfo o hay un error?</h2>
  <p>Escribinos por cualquiera de nuestras redes con el dato y la fuente. Lo revisamos y, si corresponde, lo corregimos o lo sumamos.</p>
</section>`;
  write('sobre/index.html', layout({ title: 'Cómo verificamos', rel: 'sobre/', body }));
}

// 404
write('404.html', layout({ title: 'Página no encontrada', rel: '404.html', body: `<section class="cabecera"><h1>Esta página no existe</h1><p>Pero hay cientos de triunfos que sí. <a href="${U('archivo/')}">Ir al archivo →</a></p></section>` }));

// DATOS ABIERTOS, FEED, SITEMAP, ROBOTS
write('triunfos.json', JSON.stringify({ generado: new Date().toISOString(), total: triunfos.length, triunfos: triunfos.map((t) => ({ ...t, url: ABS(`triunfo/${t.id}/`) })) }, null, 1));

const rssItems = [...triunfos].sort((a, b) => b.publicado.localeCompare(a.publicado)).slice(0, 40).map((t) => `<item><title>${esc(t.titulo)}</title><link>${ABS(`triunfo/${t.id}/`)}</link><guid>${ABS(`triunfo/${t.id}/`)}</guid><pubDate>${new Date(t.publicado + 'T12:00:00-03:00').toUTCString()}</pubDate><category>${esc(RUBROS[t.rubro].nombre)}</category><description>${esc(t.resumen)}</description></item>`).join('\n');
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${SITE.nombre}</title><link>${ABS()}</link><description>${esc(SITE.descripcion)}</description><language>${SITE.idioma}</language>\n${rssItems}\n</channel></rss>`);

const paginas = ['', 'archivo/', 'noticias/', 'sobre/', ...Object.keys(RUBROS).map((r) => `rubro/${r}/`), ...triunfos.map((t) => `triunfo/${t.id}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paginas.map((p) => `<url><loc>${ABS(p)}</loc></url>`).join('\n')}\n</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${ABS('sitemap.xml')}\n`);

console.log(`✅ Sitio generado en dist/ — ${triunfos.length} triunfos (${noticias.length} noticias), ${paginas.length} páginas. Base: ${BASE}`);
