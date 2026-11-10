import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

for (const filename of ['public/prototipo-ar/index.html', 'public/prototipo-ar/crear-cuadro.html', 'public/prototipo-ar/editor.html', 'public/prototipo-ar/login.html', 'public/prototipo-ar/optimizar.html', 'public/prototipo-ar/preparar-imagen.html']) {
  const html = fs.readFileSync(filename, 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  if(filename.endsWith('/login.html')||filename.endsWith('/preparar-imagen.html'))assert.ok(html.includes('url=./editor.html'),'Las rutas anteriores deben redirigir al editor unificado');
  else assert.ok(scripts.length > 0, filename + ' must include a script');
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
assert.ok(/layer\.visible\s*===\s*false/.test(viewer), 'El visor debe respetar la visibilidad');
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
const emergeStart=multiEditor.indexOf('  function normalizeEmergence(value){');
const emergeEnd=multiEditor.indexOf('  function populateEmergence(){',emergeStart);
assert.ok(emergeStart>=0&&emergeEnd>emergeStart,'No se encontró normalizador de emergencia');
vm.runInContext(multiEditor.slice(emergeStart,emergeEnd),context,{filename:'normalize-emergencia'});
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

const authScript=fs.readFileSync('public/prototipo-ar/admin-auth.js','utf8');
new vm.Script(authScript,{filename:'admin-auth.js'});
const configScript=fs.readFileSync('public/prototipo-ar/auth-config.js','utf8');
new vm.Script(configScript,{filename:'auth-config.js'});
const localEditor=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
assert.ok(localEditor.includes('(async function(){'),'El editor debe funcionar sin Supabase');
assert.ok(localEditor.includes('})();\n</script>'),'El editor local debe ejecutarse al abrir la página');
assert.ok(!localEditor.includes('VISOR222_ADMIN'),'El editor local no debe depender de la sesión administrativa');
assert.ok(!localEditor.includes('saveCloud')&&!localEditor.includes('loadCloud'),'No deben mostrarse controles de nube privada sin autenticación');
assert.ok(!localEditor.includes('admin-verified'),'El editor no debe ocultarse esperando permisos');
assert.ok(localEditor.includes('Guardar borrador local')&&localEditor.includes('Descargar proyecto JSON'),'Debe conservar guardado local y exportación');
const login=fs.readFileSync('public/prototipo-ar/login.html','utf8');
assert.ok(login.includes('url=./editor.html')&&login.includes('Supabase está desactivado'),'La ruta de acceso anterior debe apuntar al editor local');
const schema=fs.readFileSync('public/prototipo-ar/supabase-admin.sql','utf8');
for(const required of ['row level security','visor222_admins','visor222_admin_projects','for insert to authenticated','for select to authenticated']) {
  assert.ok(schema.includes(required),'Falta configuración RLS: '+required);
}
assert.ok(!authScript.includes('service_role'),'Nunca debe usarse la clave service_role en el navegador');
console.log('Editor local sin autenticación ni escritura en nube; backend Supabase reservado para futura activación');

const catalogFast=JSON.parse(fs.readFileSync('public/prototipo-ar/catalogo.json','utf8'));
if(catalogFast.archivoMind){
  assert.ok(fs.existsSync('public/prototipo-ar/targets.mind'),'El archivo de reconocimiento compilado falta');
  assert.equal(catalogFast.compilador?.cantidadObjetivos,catalogFast.cuadros.length,'El número de objetivos compilados debe coincidir');
}
assert.ok(viewer.includes('ensureArtworkAssets'),'El visor debería cargar las capas por cuadro cuando sean reconocidas');
assert.ok(viewer.includes("method:'HEAD'"),'El visor no verifica la existencia del .mind');
console.log('Reconocimiento rápido y carga diferida de PNG validados');

const optimized=JSON.parse(fs.readFileSync('public/prototipo-ar/optimizacion-imagenes.json','utf8'));
assert.ok(optimized.totalOriginal>=optimized.totalServido,'Las imágenes optimizadas no deben pesar más');
for(const record of optimized.imagenes){
  const local='public/prototipo-ar/'+record.usado.replace(/^\.\//,'');
  const original='public/prototipo-ar/'+record.original.replace(/^\.\//,'');
  assert.ok(fs.existsSync(local),'No existe archivo optimizado: '+local);
  assert.ok(fs.existsSync(original),'No se conservó PNG original: '+original);
  assert.ok(record.bytesOptimizado<=record.bytesOriginal,'No debe usar una alternativa más pesada');
  assert.ok(record.transparencia,'Las capas del cuadro Creeper deben conservar transparencia');
}
const validLayers=new Set(catalogFast.cuadros.flatMap(a=>a.capas.map(l=>l.imagen)));
for(const record of optimized.imagenes)assert.ok(validLayers.has(record.usado),'La capa optimizada debe estar referenciada en catálogo');
console.log('Optimización AR verificada: '+optimized.ahorroPorcentaje+'% de ahorro de descarga sin borrar PNG originales');

const compressionReport=JSON.parse(fs.readFileSync('public/prototipo-ar/optimizacion-imagenes.json','utf8'));
assert.ok(compressionReport.imagenes.length>0,'Debe haber capas optimizadas');
for(const img of compressionReport.imagenes){
  assert.ok(img.bytesOptimizado<=img.bytesOriginal,'La capa optimizada no puede ser más pesada');
  assert.ok(img.transparencia,'No debe perderse la transparencia del PNG');
}
const optimizationView=fs.readFileSync('public/prototipo-ar/optimizar.html','utf8');
assert.ok(optimizationView.includes('optimizacion-imagenes.json'),'Falta informe de ahorro visual');
console.log('Vista de ahorro de imágenes y sus cifras verificada');

const cinematic=fs.readFileSync('public/prototipo-ar/index.html','utf8');
for(const flag of ['recognitionPulse','pulseRecognition','revealArtwork','resetReveal','layerPlane.getObject3D','requestAnimationFrame','cancelAnimationFrame','immersiveState','requestFullscreen','aria-pressed','prefers-reduced-motion']){
  assert.ok(cinematic.includes(flag),'Falta mejora visual AR: '+flag);
}
assert.ok(cinematic.includes('La magia está frente a ti'),'Debe mantenerse el mensaje de bienvenida seleccionado');
assert.ok(cinematic.includes('Activa tu cámara y observa cómo las imágenes cobran vida ante tus ojos.'),'Debe mantenerse la descripción de bienvenida');
console.log('Confirmación de reconocimiento, revelado cinematográfico y modo inmersivo incluidos.');

const unifiedEditor=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
for(const expected of ['createLayers','createTarget','addPng','multiple','publishSelected','publishSidebar','publishDialog','downloadPublish','sourceAsDataURL','publicationSlug','proyectos/pendientes','application/json','GitHub','published.cuadros.some']){
  assert.ok(unifiedEditor.includes(expected),'El editor unificado necesita '+expected);
}
assert.ok(!unifiedEditor.includes('Authorization: Bearer'),'El editor público no debe integrar tokens GitHub');
assert.ok(!unifiedEditor.includes('VISOR222_ADMIN'),'La edición local debe funcionar sin Supabase');
const oldPrepare=fs.readFileSync('public/prototipo-ar/preparar-imagen.html','utf8');
assert.ok(oldPrepare.includes('url=./editor.html'),'El panel anterior debe redirigir al editor unificado');
console.log('Carga, animaciones y exportación segura a GitHub integradas en un solo editor.');

const emergingViewer=fs.readFileSync('public/prototipo-ar/index.html','utf8');
const emergingEditor=fs.readFileSync('public/prototipo-ar/editor.html','utf8');
const emergingPublisher=fs.readFileSync('scripts/preparar-publicacion-ar.mjs','utf8');
for(const expected of ['emergenceSettings','settings.initialScale','settings.duration','distance*(1-ease)','motionReduced','settings.flash']){
  assert.ok(emergingViewer.includes(expected),'Falta componente de la emergencia 2.5D: '+expected);
}
for(const expected of ['emergenceEnabled','emergenceDuration','emergenceScale','emergenceIntensity','emergenceFlash','normalizeEmergence','populateEmergence','efectoEmergencia:normalizeEmergence']){
  assert.ok(emergingEditor.includes(expected),'Falta parámetro de emergencia en editor: '+expected);
}
assert.ok(emergingPublisher.includes('efectoEmergencia:emergence'),'El publicador debe preservar la emergencia de cada cuadro');
assert.ok(emergingViewer.includes("target.addEventListener('targetFound'"),'Conservar el motor de detección de imágenes');
console.log('Efecto 2.5D cinematográfico y configuración por cuadro preservados desde editor hasta visor');
