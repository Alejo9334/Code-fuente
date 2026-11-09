import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

for (const filename of ['public/prototipo-ar/index.html', 'public/prototipo-ar/crear-cuadro.html']) {
  const html = fs.readFileSync(filename, 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, filename + ' must include a script');
  for (const [, source] of scripts) {
    if (source.trim()) new vm.Script(source, { filename });
  }
  console.log('JS validado:', filename);
}
const html=fs.readFileSync('public/prototipo-ar/crear-cuadro.html','utf8');
assert.ok(html.includes("orderedIds=[5,4,3,2,1]"), 'Depth order should be 5 to 1');
assert.ok(html.includes('visor222-prototipo-catalogo'), 'Local catalog handoff missing');
console.log('Orden de capas y conexión editor-visor verificados');
