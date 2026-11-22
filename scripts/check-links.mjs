// Revisa que las URLs de las fuentes respondan. Sale con error si alguna está rota.
import fs from 'node:fs';
const dir = new URL('../data/triunfos/', import.meta.url);
const urls = new Map();
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  for (const s of JSON.parse(fs.readFileSync(new URL(f, dir))).fuentes || []) urls.set(s.url, f);
}
const rotos = [];
await Promise.all([...urls].map(async ([url, f], i) => {
  await new Promise((r) => setTimeout(r, i * 150));
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; ArgentriunfosLinkCheck/1.0)' }, signal: AbortSignal.timeout(20000) });
    if (res.status >= 400 && res.status !== 403 && res.status !== 429) rotos.push(`${res.status}  ${url}  (${f})`);
  } catch (e) { rotos.push(`ERR  ${url}  (${f}) ${e.message}`); }
}));
console.log(`${urls.size} fuentes revisadas.`);
if (rotos.length) { console.error('Fuentes rotas:\n' + rotos.join('\n')); process.exit(1); }
console.log('✅ Todas las fuentes responden.');
