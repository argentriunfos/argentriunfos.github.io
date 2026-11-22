// Argentriunfos — interacciones del lado del cliente (sin dependencias).
(function () {
  // ── Filtros del archivo ──
  const lista = document.getElementById('archivo-lista');
  if (lista) {
    const $ = (id) => document.getElementById(id);
    const texto = $('f-texto'), rubro = $('f-rubro'), decada = $('f-decada'), nivel = $('f-nivel'), res = $('f-resultado');
    const cards = [...lista.querySelectorAll('.card')];
    const params = new URLSearchParams(location.search);
    texto.value = params.get('q') || '';
    rubro.value = params.get('rubro') || '';
    decada.value = params.get('decada') || '';
    nivel.value = params.get('nivel') || '';
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    function filtrar() {
      const q = norm(texto.value.trim());
      let n = 0;
      for (const c of cards) {
        const ok = (!q || norm(c.dataset.texto).includes(q))
          && (!rubro.value || c.dataset.rubro === rubro.value)
          && (!decada.value || Math.floor(+c.dataset.anio / 10) * 10 === +decada.value)
          && (!nivel.value || c.dataset.nivel === nivel.value);
        c.hidden = !ok;
        if (ok) n++;
      }
      res.textContent = n === 1 ? '1 triunfo' : `${n} triunfos`;
      const p = new URLSearchParams();
      if (texto.value) p.set('q', texto.value);
      if (rubro.value) p.set('rubro', rubro.value);
      if (decada.value) p.set('decada', decada.value);
      if (nivel.value) p.set('nivel', nivel.value);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
    [texto, rubro, decada, nivel].forEach((el) => el.addEventListener('input', filtrar));
    filtrar();
  }

  // ── Un día como hoy (home) ──
  const datos = document.getElementById('datos-mini');
  if (datos) {
    const hoy = new Date();
    const md = String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    const items = JSON.parse(datos.textContent).filter((t) => t.fecha.length === 10 && t.fecha.slice(5) === md);
    if (items.length) {
      const cont = document.getElementById('hoy-lista');
      const base = window.ARG_BASE || '/';
      cont.innerHTML = items.map((t) => {
        const anios = hoy.getFullYear() - +t.fecha.slice(0, 4);
        return `<article class="card nivel-borde-${t.nivel}"><div class="card-top"><span class="rubro-tag">Hace ${anios} año${anios === 1 ? '' : 's'}</span><span class="card-fecha">${t.fecha.slice(0, 4)}</span></div><h3><a href="${base}triunfo/${t.id}/">${t.titulo.replace(/</g, '&lt;')}</a></h3></article>`;
      }).join('');
      document.getElementById('hoy').hidden = false;
    }
  }
})();
