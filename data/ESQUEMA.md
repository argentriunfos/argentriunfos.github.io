# Formato de un triunfo

Cada triunfo es **un archivo JSON** en `data/triunfos/`, con el nombre `<id>.json`.
Para sumar un triunfo nuevo basta con agregar un archivo y hacer push: la web se regenera sola.

```json
{
  "id": "leonas-campeonas-mundiales-2026",
  "tipo": "noticia",
  "titulo": "¡Las Leonas son tricampeonas del mundo!",
  "fecha": "2026-08-29",
  "rubro": "deportes",
  "disciplina": "Hockey sobre césped",
  "protagonistas": ["Las Leonas", "Cristina Cosentino"],
  "lugar": "Países Bajos",
  "nivel": 1,
  "resumen": "Una o dos oraciones. Se usa en tarjetas, redes y buscadores.",
  "contenido": ["Párrafo 1.", "Párrafo 2."],
  "fuentes": [
    { "medio": "Perfil", "titulo": "Título de la nota", "url": "https://..." }
  ],
  "verificacion": { "estado": "verificado", "fecha": "2026-08-30", "nota": "Confirmado en dos medios independientes." },
  "etiquetas": ["las leonas", "mundial"],
  "publicado": "2026-08-30",
  "imagen": null
}
```

| Campo | Obligatorio | Detalle |
|---|---|---|
| `id` | sí | Igual al nombre del archivo. Solo minúsculas, números y guiones. Sugerido: `quien-que-anio`. |
| `tipo` | sí | `noticia` (triunfo nuevo, sale en "Últimos triunfos") o `historico` (va al archivo). |
| `titulo` | sí | Título épico pero preciso. |
| `fecha` | sí | Cuándo fue el triunfo: `AAAA-MM-DD`, o `AAAA-MM` / `AAAA` si no se sabe el día. |
| `rubro` | sí | Una clave de `data/rubros.json` (deportes, ciencia, cultura, tecnologia, esports, educacion, gastronomia, sociedad). |
| `nivel` | sí | 1 Hazaña histórica · 2 Gloria internacional · 3 Gran logro · 4 Orgullo de nicho (ver `data/niveles.json`). |
| `resumen` | sí | 1–2 oraciones. |
| `fuentes` | sí | Al menos una; las noticias nuevas deberían tener **dos fuentes independientes**. |
| `verificacion.estado` | sí | `verificado` se publica. `en_revision` queda guardado pero **no sale en la web** hasta que la periodista lo apruebe. |
| `publicado` | no | Fecha de publicación en la web (ordena las noticias). |
| `contenido`, `protagonistas`, `lugar`, `disciplina`, `etiquetas`, `imagen` | no | Enriquecen la ficha. `imagen`: `{ "url": "...", "credito": "..." }` (reservado). |

## Flujo sugerido para el pipeline diario

1. El robot detecta un triunfo y escribe el JSON con `"verificacion": { "estado": "en_revision" }`.
2. Lo sube en una rama y abre un Pull Request (o lo deja directo en `main`, porque no se publica).
3. La periodista revisa, corrige y cambia el estado a `verificado`.
4. Al llegar a `main`, la web se regenera y publica sola en minutos.

`node scripts/build.mjs` valida todos los archivos y frena la publicación si algo está mal formado.
