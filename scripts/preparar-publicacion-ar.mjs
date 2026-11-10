#!/usr/bin/env node
// Convertir un JSON exportado desde el editor en archivos publicables estáticos.
// Sin --apply: prepara una carpeta independiente, sin modificar el catálogo.
// Con --apply: actualiza SOLO los archivos de la rama donde se ejecute.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SITE=path.join(ROOT,'public','prototipo-ar');
const args=process.argv.slice(2);
const apply=args.includes('--apply');
const append=args.includes('--append');
if(append&&!apply)throw Error('Para agregar cuadros usa --append junto con --apply');
const source=args.find(arg=>arg!=='--apply'&&arg!=='--append');
if(!source)throw Error('Uso: node scripts/preparar-publicacion-ar.mjs proyectos/por-publicar.json [--apply]');
const INPUT=path.resolve(ROOT,source);
if(!INPUT.startsWith(path.join(ROOT,'proyectos')+path.sep)||!INPUT.endsWith('.json'))
  throw Error('Por seguridad, solo se aceptan JSON dentro de proyectos/');
const inputInfo=fs.statSync(INPUT);
if(!inputInfo.isFile()||inputInfo.size>24*1024*1024)throw Error('JSON demasiado grande (máximo 24 MB)');
const input=JSON.parse(fs.readFileSync(INPUT,'utf8'));
if(!Array.isArray(input.cuadros)||input.cuadros.length<1||input.cuadros.length>30)
  throw Error('Se requieren entre 1 y 30 cuadros');
const TARGET=apply?SITE:path.join(ROOT,'tmp','ar-publicacion-revision');
if(!apply){fs.rmSync(TARGET,{recursive:true,force:true});fs.mkdirSync(TARGET,{recursive:true});}
function slug(name){
  const value=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,64);
  if(!value)throw Error('Identificador de cuadro o capa inválido');
  return value;
}
function mimeExtension(mime){return mime==='image/png'?'.png':mime==='image/jpeg'?'.jpg':null;}
function decodeAsset(asset,relative,expectedMime){
  if(typeof asset!=='string'||!asset)throw Error('Falta archivo de imagen: '+relative);
  const data=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(asset);
  if(data){
    const mime=data[1].toLowerCase(),ext=mimeExtension(mime);
    if(expectedMime&&mime!==expectedMime)throw Error('Se esperaba '+expectedMime+' en '+relative);
    if(!ext)throw Error('Formato no admitido');
    const bytes=Buffer.from(data[2].replace(/\s/g,''),'base64');
    if(bytes.length<32||bytes.length>8*1024*1024)throw Error('Archivo fuera de rango: '+relative);
    const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes.at(-2)===0xff&&bytes.at(-1)===0xd9;
    if(mime==='image/png'&&!png||mime==='image/jpeg'&&!jpeg)throw Error('Cabecera inválida: '+relative);
    const dest=path.join(TARGET,relative+ext);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,bytes);
    return './'+relative.replace(/\\/g,'/')+ext;
  }
  if(!/^\.\/[a-z0-9_./-]+\.(?:png|jpg|jpeg|webp)$/i.test(asset)||asset.includes('..'))
    throw Error('Ruta no permitida. Usa PNG/JPG incrustado o rutas públicas relativas: '+relative);
  const sourceFile=path.resolve(SITE,asset);
  if(!sourceFile.startsWith(SITE+path.sep)||!fs.existsSync(sourceFile))
    throw Error('Archivo público inexistente: '+asset);
  if(expectedMime&&path.extname(sourceFile).toLowerCase()!=='.png')
    throw Error('La capa debe ser PNG: '+asset);
  if(!apply){
    const relativePath=asset.slice(2),dest=path.join(TARGET,relativePath);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(sourceFile,dest);
  }
  return asset;
}
const used=new Set();
const output={
  version:3,
  titulo:String(input.titulo||'Visor-222 · Cuadros AR').slice(0,150),
  descripcion:'Catálogo estático validado para Visor-222 Preview',
  cuadros:input.cuadros.map((art,index)=>{
    if(!art||!art.id||!art.imagenObjetivo||!Array.isArray(art.capas)||!art.capas.length||art.capas.length>15)
      throw Error('El cuadro '+(index+1)+' requiere referencia y 1-15 capas');
    const id=slug(art.id);if(used.has(id))throw Error('ID de cuadro duplicado: '+id);used.add(id);
    const ratio=Number(art.relacionAltoAncho);
    if(!Number.isFinite(ratio)||ratio<=0||ratio>5)throw Error('Relación de aspecto inválida: '+id);
    const prefix='cuadros/'+id;
    const target=decodeAsset(art.imagenObjetivo,prefix+'/referencia');
    const layerIds=new Set();
    const layers=art.capas.map((l,i)=>{
      if(!l||!l.id||!l.imagen)throw Error('Capa sin ID o imagen: '+id);
      const layerId=slug(l.id);
      if(layerIds.has(layerId))throw Error('Capa duplicada: '+layerId);
      layerIds.add(layerId);
      const image=decodeAsset(l.imagen,prefix+'/capa-'+String(i+1).padStart(2,'0')+'-'+layerId,'image/png');
      for(const n of ['ancho','alto','x','y','z','opacidad']){
        if(!Number.isFinite(Number(l[n])))throw Error('Valor inválido en '+id+'/'+layerId+': '+n);
      }
      if(l.ancho<=0||l.alto<=0||Math.abs(l.x)>1||Math.abs(l.y)>1||l.z<0||l.z>1||l.opacidad<0||l.opacidad>1)
        throw Error('Dimensiones fuera de rango: '+layerId);
      const a=l.animacion||{},type=['ninguna','flotar','pulso','girar'].includes(a.tipo)?a.tipo:'ninguna';
      return {
        id:layerId,nombre:String(l.nombre||layerId).slice(0,100),imagen:image,
        ancho:Number(l.ancho),alto:Number(l.alto),x:Number(l.x),y:Number(l.y),z:Number(l.z),
        rotation:Number(l.rotation||0),opacidad:Number(l.opacidad),
        visible:l.visible!==false,
        animacion:{
          tipo:type,amplitud:Number.isFinite(Number(a.amplitud))?Number(a.amplitud):0,
          duracionMs:Number.isFinite(Number(a.duracionMs))?Number(a.duracionMs):2000
        }
      };
    });
    const e=art.efectoEmergencia||{};
    const emergence={
      activo:e.activo!==false,
      duracionMs:Math.max(500,Math.min(3000,Number(e.duracionMs)||1400)),
      escalaInicial:Math.max(.4,Math.min(1,Number(e.escalaInicial)||.7)),
      intensidad:['suave','media','cinematografica'].includes(e.intensidad)?e.intensidad:'cinematografica',
      destello:e.destello!==false
    };
    return {id,nombre:String(art.nombre||id).slice(0,100),targetIndex:index,
      relacionAltoAncho:ratio,imagenObjetivo:target,capas:layers,efectoEmergencia:emergence};
  })
};
if(append){
  const current=JSON.parse(fs.readFileSync(path.join(SITE,'catalogo.json'),'utf8'));
  if(!Array.isArray(current.cuadros))throw Error('El catálogo existente no contiene cuadros');
  const existingIds=new Set(current.cuadros.map(art=>art.id));
  const collision=output.cuadros.find(art=>existingIds.has(art.id));
  if(collision)throw Error('Este cuadro ya existe. Cambia su identificador: '+collision.id);
  if(current.cuadros.length+output.cuadros.length>30)throw Error('El catálogo admite hasta 30 cuadros');
  output.cuadros=[
    ...current.cuadros.map((art,i)=>({...art,targetIndex:i})),
    ...output.cuadros.map((art,i)=>({...art,targetIndex:current.cuadros.length+i}))
  ];
}
fs.mkdirSync(TARGET,{recursive:true});
const dest=path.join(TARGET,'catalogo.json');
const staged=dest+'.tmp';
fs.writeFileSync(staged,JSON.stringify(output,null,2)+'\n');
fs.renameSync(staged,dest);
console.log(JSON.stringify({modo:apply?'APLICADO_EN_RAMA':'REVISION_SIN_PUBLICAR',
  carpeta:path.relative(ROOT,TARGET),cuadros:output.cuadros.length,
  capas:output.cuadros.reduce((n,a)=>n+a.capas.length,0)},null,2));
