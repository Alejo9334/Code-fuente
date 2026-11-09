// Optimización automática no destructiva de las capas PNG de Visor-222.
// Ejecución: node .ar-tools/optimizar.mjs
// Usar una copia de este archivo dentro de .ar-tools/ con sharp instalado ahí.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT=process.cwd();
const SITE=path.join(ROOT,'public','prototipo-ar');
const FILE=path.join(SITE,'catalogo.json');
const manifestFile=path.join(SITE,'optimizacion-imagenes.json');
const catalog=JSON.parse(await fs.readFile(FILE,'utf8'));
if(!Array.isArray(catalog.cuadros)||!catalog.cuadros.length)throw Error('No hay cuadros registrados.');
const stats=[];
const seen=new Map();
const EPS=.95;
const maxDimension=4096;
const maxBytes=12*1024*1024;

async function optimizeLayer(asset){
  if(typeof asset!=='string'||!asset.startsWith('./'))throw Error('Ruta de imagen no autorizada');
  if(!/\.png$/i.test(asset))return asset;
  if(asset.includes('..')||asset.includes('\\')||/[?#]/.test(asset))throw Error('Ruta de imagen insegura: '+asset);
  if(seen.has(asset))return seen.get(asset);
  const source=path.resolve(SITE,asset);
  if(!source.startsWith(SITE+path.sep))throw Error('Archivo fuera de la carpeta AR');
  const info=await fs.stat(source);
  if(!info.isFile()||info.size<32||info.size>maxBytes)throw Error('PNG inválido o demasiado grande: '+asset);
  const input=await fs.readFile(source);
  const png=sharp(input,{limitInputPixels:25e6,failOn:'error'});
  const meta=await png.metadata();
  if(meta.format!=='png'||!meta.width||!meta.height||
     meta.width>maxDimension||meta.height>maxDimension)throw Error('Dimensiones PNG no válidas: '+asset);
  // El formato WebP conserva canal alpha. AlphaQuality=100 preserva la máscara.
  const lossless=await sharp(input).webp({lossless:true,effort:6}).toBuffer();
  const visuallyLossless=await sharp(input).webp({
    quality:93,alphaQuality:100,effort:6,smartSubsample:true
  }).toBuffer();
  // Si el WebP sin pérdida está cerca del tamaño del de calidad 93,
  // se prioriza la fidelidad perfecta de color y transparencia.
  let best=lossless.length<=visuallyLossless.length*1.15?lossless:visuallyLossless;
  let mode=best===lossless?'sin pérdida':'calidad 93/100';
  const relative=asset.slice(0,-4)+'.optimized.webp';
  const output=path.resolve(SITE,relative);
  let chosen=asset;
  if(best.length<=input.length*EPS){
    const verified=await sharp(best).metadata();
    if(verified.format!=='webp'||verified.width!==meta.width||
       verified.height!==meta.height||Boolean(verified.hasAlpha)!==Boolean(meta.hasAlpha)){
      throw Error('La conversión no conserva dimensiones o transparencia: '+asset);
    }
    await fs.writeFile(output+'.tmp',best);
    await fs.rename(output+'.tmp',output);
    chosen='./'+relative.replace(/^\.\//,'');
  }
  const record={
    original:asset,usado:chosen,ancho:meta.width,alto:meta.height,
    transparencia:!!meta.hasAlpha,bytesOriginal:input.length,
    bytesOptimizado:chosen===asset?input.length:best.length,
    ahorroPorcentaje:chosen===asset?0:Math.round((1-best.length/input.length)*1000)/10,
    metodo:chosen===asset?'Se conserva PNG original':mode
  };
  stats.push(record);
  seen.set(asset,chosen);
  console.log(record.original,'→',record.usado,record.ahorroPorcentaje+'%');
  return chosen;
}

for(const art of catalog.cuadros){
  for(const layer of art.capas||[]){
    layer.imagen=await optimizeLayer(layer.imagen);
  }
}
// Conservar las mediciones de capas optimizadas en ejecuciones anteriores.
const active=new Set(catalog.cuadros.flatMap(a=>(a.capas||[]).map(l=>l.imagen)));
let previous=[];
try{
  const saved=JSON.parse(await fs.readFile(manifestFile,'utf8'));
  previous=(saved.imagenes||[]).filter(r=>
    active.has(r.usado)&&!stats.some(n=>n.original===r.original));
}catch(err){if(err.code!=='ENOENT')throw err;}
const history=[...previous,...stats];
const report={
  version:1,cuadros:catalog.cuadros.length,
  totalOriginal:history.reduce((sum,r)=>sum+r.bytesOriginal,0),
  totalServido:history.reduce((sum,r)=>sum+r.bytesOptimizado,0),
  imagenes:history
};
report.ahorroPorcentaje=report.totalOriginal?
  Math.round((1-report.totalServido/report.totalOriginal)*1000)/10:0;
await fs.writeFile(FILE,JSON.stringify(catalog,null,2)+'\n');
await fs.writeFile(manifestFile,JSON.stringify(report,null,2)+'\n');
console.log('Resumen optimización:',JSON.stringify({
  procesadas:stats.length,capasRegistradas:history.length,ahorro:report.ahorroPorcentaje+'%',
  bytesAntes:report.totalOriginal,bytesDespues:report.totalServido
}));
