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
        return `<article class="card nivel-borde-${t.nivel}"><div class="card-top"><span class="cartel">Hace ${anios} año${anios === 1 ? '' : 's'}</span><span class="card-fecha">${t.fecha.slice(0, 4)}</span></div><h3><a href="${base}triunfo/${t.id}/">${t.titulo.replace(/</g, '&lt;')}</a></h3></article>`;
      }).join('');
      document.getElementById('hoy').hidden = false;
    }
  }
  // ── Formulario "Contá tu triunfo" → Google Forms ──
  const form = document.getElementById('form-triunfo');
  if (form) {
    const estado = document.getElementById('form-estado');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const datos = Object.fromEntries(new FormData(form));
      const accion = form.dataset.accion;
      const campos = JSON.parse(form.dataset.campos || '{}');
      const boton = form.querySelector('button[type=submit]');
      estado.className = 'form-estado';
      if (!accion) {
        const texto = Object.entries(datos).map(([k, v]) => `${k}: ${v}`).join('\n');
        try { await navigator.clipboard.writeText(texto); } catch (e) {}
        estado.innerHTML = 'Estamos terminando de activar el formulario. Copiamos tu historia: pegala en un mensaje a <a href="' + form.dataset.respaldo + '" target="_blank" rel="noopener">nuestro Instagram</a> y la recibimos igual.';
        estado.classList.add('error');
        return;
      }
      const body = new URLSearchParams();
      for (const [k, entry] of Object.entries(campos)) if (datos[k]) body.append(entry, datos[k]);
      boton.disabled = true;
      estado.textContent = 'Enviando…';
      try {
        await fetch(accion, { method: 'POST', mode: 'no-cors', body });
        form.reset();
        estado.textContent = '¡Gracias! Recibimos tu triunfo. Lo vamos a verificar y, si todo está en orden, lo publicamos. Puede que te contactemos para chequear algún dato.';
        estado.classList.add('ok');
      } catch (e) {
        estado.textContent = 'No se pudo enviar. Revisá tu conexión e intentá de nuevo.';
        estado.classList.add('error');
      } finally {
        boton.disabled = false;
      }
    });
  }
})();
