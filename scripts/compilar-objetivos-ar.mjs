import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadImage,createCanvas} from 'canvas';
import {OfflineCompiler} from 'mind-ar/src/image-target/offline-compiler.js';

// Compilación anticipada de imágenes de reconocimiento en un runner Node.
// Un único .mind mantiene exactamente el orden targetIndex del catálogo.
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dirname,'..');
const base=path.join(root,'public','prototipo-ar');
const catalogPath=path.join(base,'catalogo.json');
const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8'));
if(!Array.isArray(catalog.cuadros)||catalog.cuadros.length===0||catalog.cuadros.length>30) {
  throw Error('Catálogo AR vacío o supera 30 cuadros');
}
const pictures=[...catalog.cuadros].sort((a,b)=>a.targetIndex-b.targetIndex);
const images=[];
for(const [i,art] of pictures.entries()){
  if(art.targetIndex!==i)throw Error('Los índices de imágenes deben ser consecutivos desde 0');
  if(!/^\.\/[\w./-]+\.(?:png|jpg|jpeg|webp)$/i.test(art.imagenObjetivo)||art.imagenObjetivo.includes('..')) {
    throw Error('Referencia inválida para '+art.id);
  }
  const file=path.resolve(base,art.imagenObjetivo);
  if(!file.startsWith(base+path.sep))throw Error('Referencia fuera del catálogo');
  const img=await loadImage(file);
  // Reducir la entrada para evitar picos de memoria y CPU en catálogos grandes.
  // Se conserva proporción y detalle suficiente para la detección.
  const limit=1200,scale=Math.min(1,limit/Math.max(img.width,img.height));
  const width=Math.max(64,Math.round(img.width*scale));
  const height=Math.max(64,Math.round(img.height*scale));
  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,0,0,width,height);
  images.push(canvas);
  console.log('Objetivo '+(i+1)+'/'+pictures.length+': '+art.nombre+' ('+width+'x'+height+')');
}
const compiler=new OfflineCompiler();
const begin=Date.now();
await compiler.compileImageTargets(images,progress=>{
  if(Math.round(progress)%20===0)console.log('Extracción de características '+Math.round(progress)+'%');
});
const bytes=await compiler.exportData();
if(!bytes||bytes.length<100)throw Error('El compilador devolvió un archivo vacío');
const filename='targets.mind';
await fs.writeFile(path.join(base,filename),Buffer.from(bytes));
catalog.archivoMind='./'+filename;
catalog.compilador={motor:'mind-ar',version:'1.2.5',cantidadObjetivos:pictures.length};
await fs.writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log('Archivo generado: '+filename+' ('+bytes.length+' bytes), '+pictures.length+' objetivos, '+Math.round((Date.now()-begin)/1000)+' segundos');
