// Argentriunfos — generador estático sin dependencias.
// Lee data/triunfos/*.json y genera el sitio completo en dist/.
// Uso: node scripts/build.mjs            (usa "base" de site.config.json)
//      BASE=/ node scripts/build.mjs     (para dominio propio o pruebas locales)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esquina, guarda, brillo } from './filete.mjs';

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
const write = (rel, content) => {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};

// ───────────────────────── Piezas de fileteado ─────────────────────────
// Las cuatro esquinas de un marco fileteado (la misma voluta, rotada).
const esquinas = () => ['tl', 'tr', 'bl', 'br'].map((p) => `<img class="esq esq-${p}" src="${U('assets/filete-esquina.svg')}" alt="" aria-hidden="true">`).join('');
const guardaImg = (cls = '') => `<img class="guarda ${cls}" src="${U('assets/filete-guarda.svg')}" alt="" aria-hidden="true">`;
const cinta = (texto, tag = 'h2') => `<div class="cinta-wrap"><${tag} class="cinta"><span>${texto}</span></${tag}></div>`;

const COLORES_RUBRO = { deportes: 'rojo', ciencia: 'verde', cultura: 'azul', tecnologia: 'celeste', esports: 'violeta', educacion: 'oro', gastronomia: 'bordo', sociedad: 'celeste' };
const estrellas = (n) => `<span class="estrellas" aria-label="${5 - n} de 4">${'★'.repeat(5 - n)}${'<span class="apagada">★</span>'.repeat(n - 1)}</span>`;
const nivelBadge = (n) => `<span class="nivel" title="${esc(NIVELES[n].descripcion)}">${estrellas(n)} ${esc(NIVELES[n].nombre)}</span>`;
const rubroBadge = (r) => `<a class="cartel cartel-${COLORES_RUBRO[r]}" href="${U('rubro/' + r + '/')}">${esc(RUBROS[r].nombre)}</a>`;

function card(t) {
  return `<article class="card ${t.nivel === 1 ? 'card-oro' : ''}" data-rubro="${t.rubro}" data-anio="${anio(t)}" data-nivel="${t.nivel}" data-tipo="${t.tipo}" data-texto="${esc([t.titulo, t.resumen, t.disciplina, ...t.protagonistas, ...t.etiquetas, t.lugar].join(' ').toLowerCase())}">
  <div class="card-top">${rubroBadge(t.rubro)}<span class="card-fecha">${esc(fechaLarga(t.fecha))}</span></div>
  <h3><a href="${U('triunfo/' + t.id + '/')}">${esc(t.titulo)}</a></h3>
  <p>${esc(t.resumen)}</p>
  <div class="card-bottom">${nivelBadge(t.nivel)}<span class="verif" title="Verificado con ${t.fuentes.length} fuente(s)">Verificado ✓</span></div>
</article>`;
}

const botonContar = (cls = '') => `<a class="boton-contar ${cls}" href="${U('conta-tu-triunfo/')}"><span>¡Contá tu triunfo!</span></a>`;

function layout({ title, description, rel, body, jsonld, ogType = 'website' }) {
  const fullTitle = title ? `${title} | ${SITE.nombre}` : `${SITE.nombre}: ${SITE.lema}`;
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
<meta name="theme-color" content="#141210">
<link rel="icon" href="${U('assets/favicon.png')}" type="image/png">
<link rel="apple-touch-icon" href="${U('assets/apple-touch-icon.png')}">
<link rel="alternate" type="application/rss+xml" title="${SITE.nombre}" href="${U('feed.xml')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rye&family=Bitter:ital,wght@0,400;0,600;0,800;1,400&family=Yesteryear&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${U('assets/style.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header class="top">
  <a class="logo" href="${U()}"><img src="${U('assets/logo-128.webp')}" alt="" width="48" height="48"><span>Argentriunfos</span></a>
  <nav>
    <a href="${U('noticias/')}">Noticias</a>
    <a href="${U('archivo/')}">Archivo</a>
    <a href="${U('sobre/')}">Cómo verificamos</a>
    <a class="nav-contar" href="${U('conta-tu-triunfo/')}">Contá tu triunfo</a>
  </nav>
</header>
<div class="franjas" aria-hidden="true"></div>
<main>
${body}
</main>
<footer class="pie">
  <div class="franjas" aria-hidden="true"></div>
  <div class="pie-marco">
    ${esquinas()}
    <p class="refran">Lo que gana uno, lo festejamos todos</p>
    ${guardaImg()}
    <div class="pie-inner">
      <div class="pie-marca"><img src="${U('assets/logo-128.webp')}" alt="Logo de Argentriunfos" width="88" height="88"><div><strong>Argentriunfos</strong><span>${esc(SITE.lema)}</span></div></div>
      <div class="pie-links">
        <b>Rubros</b>
        ${Object.keys(RUBROS).map((r) => `<a href="${U('rubro/' + r + '/')}">${esc(RUBROS[r].nombre)}</a>`).join('\n        ')}
      </div>
      <div class="pie-links">
        <b>El sitio</b>
        <a href="${U('conta-tu-triunfo/')}">Contá tu triunfo</a>
        <a href="${U('archivo/')}">Archivo completo</a>
        <a href="${U('sobre/')}">Cómo verificamos</a>
        <a href="${U('feed.xml')}">RSS</a>
        <a href="${U('triunfos.json')}">Datos abiertos</a>
        ${redes.map(([k, v]) => `<a href="${esc(v)}" rel="me noopener" target="_blank">${k[0].toUpperCase() + k.slice(1)}</a>`).join('\n        ')}
      </div>
    </div>
    <p class="legal">Cada triunfo publicado tiene fuentes verificables. ¿Viste un error? Escribinos y lo corregimos.</p>
  </div>
</footer>
<script src="${U('assets/app.js')}" defer></script>
</body>
</html>`;
}

// ───────────────────────── Páginas ─────────────────────────
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'), { recursive: true });
write('assets/filete-esquina.svg', esquina());
write('assets/filete-guarda.svg', guarda());
write('assets/brillo.svg', brillo());
write('.nojekyll', '');

const porRubro = Object.fromEntries(Object.keys(RUBROS).map((r) => [r, triunfos.filter((t) => t.rubro === r)]));
const anios = [...new Set(triunfos.map(anio))];
const decadas = [...new Set(triunfos.map((t) => Math.floor(anio(t) / 10) * 10))].sort((a, b) => b - a);
const mini = triunfos.map((t) => ({ id: t.id, titulo: t.titulo, fecha: t.fecha, rubro: t.rubro, nivel: t.nivel }));

const cabecera = (kicker, titulo, texto) => `
<section class="cabecera">
  ${kicker ? `<p class="refran refran-chico">${kicker}</p>` : ''}
  <h1 class="letras">${titulo}</h1>
  ${texto ? `<p>${texto}</p>` : ''}
  ${guardaImg('guarda-cabecera')}
</section>`;

// HOME
{
  const destacados = triunfos.filter((t) => t.nivel === 1 && t.tipo === 'historico').slice(0, 6);
  const body = `
<section class="hero">
  ${esquinas()}
  <div class="hero-texto">
    <p class="refran">¿Ganaste algo? ¿Conocés a alguien que ganó?</p>
    <h1 class="letras letras-grandes">Cada triunfo<br>cuenta</h1>
    ${botonContar('boton-grande')}
    <p class="hero-sub">Un torneo de barrio, una beca afuera, un premio en la escuela, un récord, un Mundial. Si lo ganó un argentino, lo queremos contar. Lo verificamos y lo publicamos.</p>
    <a class="link-archivo" href="${U('archivo/')}">o recorré los ${triunfos.length} triunfos del archivo →</a>
  </div>
  <div class="hero-logo-wrap"><img class="hero-logo" src="${U('assets/logo.webp')}" alt="Logo de Argentriunfos: un titanosaurio con la bandera argentina" width="640" height="640"></div>
</section>

<section class="carteles" aria-label="El archivo en números">
  <div class="cartel-ruta"><strong>${triunfos.length}</strong><span>triunfos verificados</span></div>
  <div class="cartel-ruta"><strong>${Object.values(porRubro).filter((x) => x.length).length}</strong><span>rubros</span></div>
  <div class="cartel-ruta"><strong>${Math.max(...anios) - Math.min(...anios)}</strong><span>años de historia</span></div>
</section>

<section class="bloque" id="hoy" hidden>
  ${cinta('Un día como hoy')}
  <div class="grid" id="hoy-lista"></div>
</section>

<section class="bloque">
  ${cinta('Últimos triunfos')}
  <div class="grid">${[...noticias, ...triunfos.filter((t) => t.tipo !== 'noticia')].slice(0, 6).map(card).join('\n')}</div>
  <p class="ver-mas"><a href="${U('noticias/')}">Ver todas las noticias →</a></p>
</section>

<section class="bloque">
  ${cinta('Por rubro')}
  <div class="rubros-grid">
    ${Object.entries(RUBROS).map(([k, r]) => `<a class="rubro-box borde-${COLORES_RUBRO[k]}" href="${U('rubro/' + k + '/')}"><strong>${esc(r.nombre)}</strong><span>${porRubro[k].length ? `${porRubro[k].length} triunfo${porRubro[k].length === 1 ? '' : 's'}` : 'Próximamente'}</span></a>`).join('\n    ')}
  </div>
</section>

<section class="bloque">
  ${cinta('Hazañas históricas')}
  <div class="grid">${destacados.map(card).join('\n')}</div>
  <p class="ver-mas"><a href="${U('archivo/?nivel=1')}">Ver todas las hazañas →</a></p>
</section>

<section class="llamado">
  ${esquinas()}
  <p class="refran">Las mejores historias no siempre salen en la tele</p>
  <h2 class="letras">¿Y vos qué ganaste?</h2>
  ${botonContar()}
</section>
<script id="datos-mini" type="application/json">${JSON.stringify(mini)}</script>
<script>window.ARG_BASE=${JSON.stringify(BASE)};</script>`;
  write('index.html', layout({ rel: '', body, jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.nombre, url: ABS(), description: SITE.descripcion, inLanguage: SITE.idioma } }));
}

// CONTÁ TU TRIUNFO
{
  const F = SITE.formulario || {};
  const body = `
${cabecera('Las mejores historias no siempre salen en la tele', 'Contá tu triunfo', 'Ganaste un torneo, una beca, un premio, un concurso. O lo ganó tu vieja, tu amigo, tu club o tu escuela. Contanos y, después de verificarlo, lo publicamos en la web y en nuestras redes.')}
<section class="bloque">
  <form class="formulario marco" id="form-triunfo" data-accion="${esc(F.accion || '')}" data-campos="${esc(JSON.stringify(F.campos || {}))}" data-respaldo="${esc(SITE.redes.instagram || '')}">
    ${esquinas()}
    <fieldset>
      <legend>El triunfo</legend>
      <label>¿Quién ganó? *<input name="protagonista" required placeholder="Nombre de la persona, equipo o institución"></label>
      <label>¿Qué ganó? *<input name="triunfo" required placeholder="Ej.: campeón sudamericano de ajedrez sub-14"></label>
      <div class="fila">
        <label>Rubro<select name="rubro">${Object.entries(RUBROS).map(([k, r]) => `<option value="${esc(r.nombre)}">${esc(r.nombre)}</option>`).join('')}<option value="Otro">Otro</option></select></label>
        <label>¿Cuándo?<input name="fecha" placeholder="Fecha aproximada"></label>
        <label>¿Dónde?<input name="lugar" placeholder="Ciudad, país o evento"></label>
      </div>
      <label>Contanos la historia *<textarea name="historia" required rows="6" placeholder="¿Cómo fue? ¿Qué costó llegar? ¿Por qué es importante?"></textarea></label>
      <label>Un link que lo pruebe<input name="link" type="url" placeholder="Nota, resultado oficial, publicación del torneo…"></label>
      <p class="ayuda">Si no tenés un link, no pasa nada: te contactamos para verificarlo.</p>
    </fieldset>
    <fieldset>
      <legend>Vos</legend>
      <div class="fila">
        <label>Tu nombre *<input name="nombre" required autocomplete="name"></label>
        <label>¿Cómo te contactamos? *<input name="contacto" required placeholder="Email, WhatsApp o Instagram"></label>
      </div>
      <label class="check"><input type="checkbox" name="autorizo" value="Sí" required> Autorizo a Argentriunfos a contactarme para verificar la historia y a publicarla. Mis datos de contacto no se publican.</label>
    </fieldset>
    <button type="submit" class="boton-contar"><span>Enviar mi triunfo</span></button>
    <p class="form-estado" id="form-estado" role="status"></p>
  </form>
</section>`;
  write('conta-tu-triunfo/index.html', layout({ title: 'Contá tu triunfo', description: 'Contanos el triunfo de un argentino o argentina. Lo verificamos y lo publicamos.', rel: 'conta-tu-triunfo/', body }));
}

// ARCHIVO
{
  const body = `
${cabecera('Todo lo que ganamos, en un solo lugar', 'El archivo', 'Todos los triunfos argentinos verificados. Buscá por nombre o filtrá por rubro, década e importancia.')}
<section class="bloque">
  <form class="filtros" id="filtros" onsubmit="return false">
    <input type="search" id="f-texto" placeholder="Buscar: Messi, Nobel, hockey, Pokémon…" aria-label="Buscar">
    <select id="f-rubro" aria-label="Rubro"><option value="">Todos los rubros</option>${Object.entries(RUBROS).map(([k, r]) => `<option value="${k}">${esc(r.nombre)}</option>`).join('')}</select>
    <select id="f-decada" aria-label="Década"><option value="">Todas las décadas</option>${decadas.map((d) => `<option value="${d}">Años ${String(d).slice(2)}${d < 2000 ? '' : ` (${d})`}</option>`).join('')}</select>
    <select id="f-nivel" aria-label="Nivel"><option value="">Toda importancia</option>${Object.entries(NIVELES).map(([k, n]) => `<option value="${k}">${'★'.repeat(5 - k)} ${esc(n.nombre)}</option>`).join('')}</select>
  </form>
  <p class="resultado" id="f-resultado">${triunfos.length} triunfos</p>
  <div class="grid" id="archivo-lista">${triunfos.map(card).join('\n')}</div>
</section>`;
  write('archivo/index.html', layout({ title: 'Archivo de triunfos', rel: 'archivo/', body }));
}

// NOTICIAS
{
  const body = `
${cabecera('Recién salidos del horno', 'Últimos triunfos', 'Las victorias argentinas más recientes, verificadas antes de publicarse.')}
<section class="bloque">
  ${noticias.length ? `<div class="grid">${noticias.map(card).join('\n')}</div>` : '<p>Muy pronto, los primeros triunfos del día.</p>'}
</section>`;
  write('noticias/index.html', layout({ title: 'Últimos triunfos', rel: 'noticias/', body }));
}

// RUBROS
for (const [k, r] of Object.entries(RUBROS)) {
  const lista = porRubro[k];
  const body = `
${cabecera('Rubro', esc(r.nombre), esc(r.descripcion))}
<section class="bloque">
  ${lista.length ? `<div class="grid">${lista.map(card).join('\n')}</div>` : `<div class="vacio marco">${esquinas()}<p>Todavía no cargamos triunfos en este rubro.</p>${botonContar()}</div>`}
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
  <header class="ficha-head">
    ${esquinas()}
    <div class="ficha-meta">${rubroBadge(t.rubro)}${t.disciplina ? `<span class="disciplina">${esc(t.disciplina)}</span>` : ''}${t.tipo === 'noticia' ? '<span class="chip-noticia">Noticia</span>' : ''}</div>
    <h1 class="letras">${esc(t.titulo)}</h1>
    <p class="ficha-fecha">${esc(fechaLarga(t.fecha))}${t.lugar ? ` · ${esc(t.lugar)}` : ''}</p>
    ${nivelBadge(t.nivel)}
  </header>
  <div class="ficha-cuerpo">
    <p class="bajada">${esc(t.resumen)}</p>
    ${t.contenido.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
    ${t.protagonistas.length ? `<h2>Protagonistas</h2><ul class="chips">${t.protagonistas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    <section class="verificacion">
      <div class="sello" aria-hidden="true"><span>Verificado</span><small>Argentriunfos</small></div>
      <h2>Fuentes de verificación</h2>
      <p>Verificado${t.verificacion.fecha ? ` el ${esc(fechaLarga(t.verificacion.fecha))}` : ''}.${t.verificacion.nota ? ' ' + esc(t.verificacion.nota) : ''}</p>
      <ol class="fuentes">${t.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener nofollow">${esc(f.titulo || f.url)}</a>${f.medio ? ` <span>(${esc(f.medio)})</span>` : ''}</li>`).join('')}</ol>
    </section>
    <div class="compartir">
      <span>Compartilo:</span>
      <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}" target="_blank" rel="noopener">WhatsApp</a>
      <a href="https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
    </div>
    ${t.etiquetas.length ? `<p class="etiquetas">${t.etiquetas.map((e) => `<a href="${U('archivo/?q=' + encodeURIComponent(e))}">#${esc(e)}</a>`).join(' ')}</p>` : ''}
  </div>
</article>
${relacionados.length ? `<section class="bloque">${cinta('Más triunfos en ' + esc(RUBROS[t.rubro].nombre))}<div class="grid">${relacionados.map(card).join('\n')}</div></section>` : ''}`;
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
${cabecera('Palabra de Argentriunfos', 'Cómo verificamos', 'Queremos ser la fuente de referencia de los logros argentinos. Por eso no se publica nada sin verificar.')}
<section class="bloque texto marco">
  ${esquinas()}
  <h2>Qué es un triunfo</h2>
  <p>Cualquier logro de una persona o equipo argentino, nacido acá o argentino por adopción, en cualquier ámbito: deporte, ciencia, cultura, tecnología, esports, educación, gastronomía y lo que venga. Desde un Mundial hasta un torneo de Pokémon o una beca en la NASA. El argentino nace donde quiere.</p>
  <h2>Cómo lo verificamos</h2>
  <ol>
    <li><strong>Detección.</strong> Todos los días revisamos medios nacionales, internacionales y especializados. Y leemos cada historia que nos mandan ustedes.</li>
    <li><strong>Contraste.</strong> Cada triunfo se confirma con al menos una fuente de referencia (organismo oficial, enciclopedia o medio reconocido). Las noticias nuevas necesitan dos fuentes independientes.</li>
    <li><strong>Revisión periodística.</strong> Una periodista revisa cada publicación antes de que salga.</li>
    <li><strong>Transparencia.</strong> Todas las fuentes quedan enlazadas en la ficha de cada triunfo, para que cualquiera lo pueda comprobar.</li>
  </ol>
  <h2>Niveles de importancia</h2>
  <ul class="niveles-lista">${Object.entries(NIVELES).map(([k, n]) => `<li>${nivelBadge(k)}: ${esc(n.descripcion)}</li>`).join('')}</ul>
  <h2>Datos abiertos</h2>
  <p>Todo el archivo está disponible en formato JSON en <a href="${U('triunfos.json')}">triunfos.json</a>, libre para usar citando la fuente.</p>
  <h2>¿Falta un triunfo o hay un error?</h2>
  <p>Mandalo desde <a href="${U('conta-tu-triunfo/')}">Contá tu triunfo</a> o escribinos por redes. Lo revisamos y, si corresponde, lo corregimos o lo sumamos.</p>
</section>`;
  write('sobre/index.html', layout({ title: 'Cómo verificamos', rel: 'sobre/', body }));
}

// 404
write('404.html', layout({ title: 'Página no encontrada', rel: '404.html', body: cabecera('Nos bajamos en la parada equivocada', 'Esta página no existe', `Pero hay un montón de triunfos que sí. <a href="${U('archivo/')}">Ir al archivo →</a>`) }));

// DATOS ABIERTOS, FEED, SITEMAP, ROBOTS
write('triunfos.json', JSON.stringify({ generado: new Date().toISOString(), total: triunfos.length, triunfos: triunfos.map((t) => ({ ...t, url: ABS(`triunfo/${t.id}/`) })) }, null, 1));

const rssItems = [...triunfos].sort((a, b) => b.publicado.localeCompare(a.publicado)).slice(0, 40).map((t) => `<item><title>${esc(t.titulo)}</title><link>${ABS(`triunfo/${t.id}/`)}</link><guid>${ABS(`triunfo/${t.id}/`)}</guid><pubDate>${new Date(t.publicado + 'T12:00:00-03:00').toUTCString()}</pubDate><category>${esc(RUBROS[t.rubro].nombre)}</category><description>${esc(t.resumen)}</description></item>`).join('\n');
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${SITE.nombre}</title><link>${ABS()}</link><description>${esc(SITE.descripcion)}</description><language>${SITE.idioma}</language>\n${rssItems}\n</channel></rss>`);

const paginas = ['', 'conta-tu-triunfo/', 'archivo/', 'noticias/', 'sobre/', ...Object.keys(RUBROS).map((r) => `rubro/${r}/`), ...triunfos.map((t) => `triunfo/${t.id}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paginas.map((p) => `<url><loc>${ABS(p)}</loc></url>`).join('\n')}\n</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${ABS('sitemap.xml')}\n`);

console.log(`✅ Sitio generado en dist/: ${triunfos.length} triunfos (${noticias.length} noticias), ${paginas.length} páginas. Base: ${BASE}`);
