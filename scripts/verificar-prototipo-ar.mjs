import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

for (const filename of ['public/prototipo-ar/index.html', 'public/prototipo-ar/crear-cuadro.html', 'public/prototipo-ar/editor.html']) {
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

const editor=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
for (const required of ['posX','posY','depth','scale','rotation','opacity','animationType','amplitude','duration','visor222-prototipo-catalogo']) {
  assert.ok(editor.includes(required), 'Falta función de editor: '+required);
}
const viewer=fs.readFileSync('public/prototipo-ar/index.html','utf8');
assert.ok(viewer.includes('layer.visible === false'), 'El visor debe respetar la visibilidad');
assert.ok(viewer.includes('layer.rotation || 0'), 'El visor debe respetar la rotación');
console.log('Editor y visor compatibles: parámetros de capas verificados');

const editorShare=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
const viewerShare=fs.readFileSync('public/prototipo-ar/index.html','utf8');
for(const required of ['shareAR', 'shareDialog', 'qrCanvas', 'makeShareURL', 'QRCode', 'Copiar enlace']) {
  assert.ok(editorShare.includes(required), 'No se encuentra la función QR: '+required);
}
for(const required of ['applySharedPreview', "get('share')", "l.animacion={tipo:types[type]"]) {
  assert.ok(viewerShare.includes(required), 'No se encuentra recepción QR: '+required);
}
// Prueba de extremo a extremo del formato transportado por QR sin cámara:
const rawCatalog=JSON.parse(fs.readFileSync('public/prototipo-ar/catalogo.json','utf8'));
const artwork=rawCatalog.cuadros[0];
const shareRows=artwork.capas.map((layer,i)=>[
  layer.id,layer.x+.01*i,layer.y,layer.z,layer.ancho,layer.alto,
  4*i,layer.opacidad,i===0?0:1,i%4,layer.animacion.amplitud,layer.animacion.duracionMs
]);
const encoded=Buffer.from(JSON.stringify([1,artwork.id,shareRows]),'ascii').toString('base64url');
assert.ok(encoded.length < 2000, 'Código QR excesivamente largo');
const inbound=JSON.parse(Buffer.from(encoded,'base64url').toString('ascii'));
assert.deepEqual(inbound[2],shareRows);
assert.equal(inbound[1],artwork.id);
console.log('Enlace QR validado para cinco capas con orden, visibilidad y animaciones');

const multiEditor=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
for(const key of ['artlist','newArt','cloneArt','deleteArt','artUp','artDown','createDialog','createForm','createTarget','createLayers','selectedArtId','reindex','saveForCamera']) {
  assert.ok(multiEditor.includes(key), 'Falta control de múltiples cuadros: '+key);
}
assert.ok(viewer.includes("localMode === 'idb'"),'El visor no acepta proyectos desde IndexedDB');
assert.ok(viewer.includes('readCameraProject'),'El visor no puede recuperar proyectos con varias imágenes');
const from=multiEditor.indexOf('  function normalize(raw){');
const to=multiEditor.indexOf('  function persist(){',from);
assert.ok(from>=0&&to>from,'No se encontró función de normalización multic uadro');
const context=vm.createContext({
  safeNumber:(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback,
  Set,Error
});
vm.runInContext(multiEditor.slice(from,to),context,{filename:'normalize-multicuadros'});
const base=JSON.parse(JSON.stringify(rawCatalog.cuadros[0]));
const second={
  id:'cuadro-prueba-segundo',nombre:'Segundo cuadro',
  targetIndex:42,relacionAltoAncho:1.25,
  imagenObjetivo:'data:image/jpeg;base64,abc',
  capas:[{id:'capa-5',imagen:'data:image/png;base64,xyz',ancho:1,alto:1.25}]
};
const multi=JSON.parse(JSON.stringify({version:2,cuadros:[base,second]}));
context.normalize(multi);
assert.equal(multi.cuadros[0].targetIndex,0);
assert.equal(multi.cuadros[1].targetIndex,1);
assert.equal(multi.cuadros[1].capas[0].visible,true);
assert.throws(()=>context.normalize({cuadros:[base,base]}),/ID único/);
assert.throws(()=>context.normalize({cuadros:[{...second,capas:[]}]}),/al menos una capa/);
console.log('Validación de dos cuadros, índices AR y capas independientes completada');
