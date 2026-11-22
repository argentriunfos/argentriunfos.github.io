# 🇦🇷 Argentriunfos — la web

El registro verificado de los triunfos de los argentinos en el mundo.

**Web:** https://lacavalorenzo.github.io/argentriunfos/

## Cómo funciona

- **Sin costo:** sitio 100% estático, generado con Node (sin dependencias) y publicado gratis en GitHub Pages.
- **Datos:** cada triunfo es un archivo en [`data/triunfos/`](data/triunfos). El formato está en [`data/ESQUEMA.md`](data/ESQUEMA.md).
- **Publicación automática:** cada push a `main` regenera y publica la web (`.github/workflows/deploy.yml`).
- **Control de fuentes:** todos los lunes se revisa que los links de las fuentes sigan vivos (`.github/workflows/check-links.yml`).

## Páginas

| Ruta | Qué es |
|---|---|
| `/` | Portada: últimos triunfos, "Un día como hoy", rubros y hazañas históricas |
| `/noticias/` | Blog de triunfos nuevos |
| `/archivo/` | Todo el archivo, con buscador y filtros por rubro, década y nivel |
| `/rubro/<rubro>/` | Triunfos de cada rubro |
| `/triunfo/<id>/` | Ficha de cada triunfo con sus fuentes de verificación y botones para compartir |
| `/sobre/` | Cómo verificamos |
| `/triunfos.json` | Datos abiertos con todo el archivo |
| `/feed.xml`, `/sitemap.xml` | RSS y sitemap para buscadores |

## Trabajar en local

```bash
BASE=/ node scripts/build.mjs   # genera dist/
npx serve dist                  # abre http://localhost:3000
```

## Dominio propio (más adelante)

Cuando haya presupuesto, un dominio `.com.ar` en NIC Argentina es muy barato. Para usarlo:
1. Cambiar `url` y `base` (a `/`) en `site.config.json`.
2. Configurar el dominio en Settings → Pages del repo y configurar el DNS según la guía de GitHub Pages.
