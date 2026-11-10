#!/usr/bin/env node
// Actualización controlada de UNA experiencia AR ya publicada, sin cambiar su marcador físico.
// Uso: node scripts/actualizar-cuadro.mjs proyectos/actualizaciones/archivo.json [public/prototipo-ar|public]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=process.argv[2],site=process.argv[3]||'public';
if(!file||!/^proyectos\/actualizaciones\/[a-zA-Z0-9._-]+\.json$/.test(file))throw Error('La solicitud debe estar en proyectos/actualizaciones/');
if(!['public','public/prototipo-ar'].includes(site))throw Error('Ruta de sitio no permitida');
const base=path.join(ROOT,site);
const source=path.join(ROOT,file);
if(!fs.statSync(source).isFile()||fs.statSync(source).size>24*1024*1024)throw Error('El archivo de actualización supera 24 MB');
const req=JSON.parse(fs.readFileSync(source,'utf8'));
if(req.operacion!=='actualizar'||!Array.isArray(req.cuadros)||req.cuadros.length!==1)throw Error('Se requiere una sola experiencia para actualizar');
const input=req.cuadros[0];
if(!input||!input.id||!Array.isArray(input.capas)||input.capas.length<1||input.capas.length>15)throw Error('El cuadro debe tener entre 1 y 15 capas');
const catalogPath=path.join(base,'catalogo.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const index=catalog.cuadros.findIndex(x=>x.id===input.id);
if(index<0)throw Error('La experiencia no existe en este sitio: '+input.id);
const current=catalog.cuadros[index];
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
if(typeof req.baseHash!=='string'||!req.baseHash||req.baseHash!==digest(current))
  throw Error('El cuadro publicado cambió desde que descargaste la actualización. Recarga el editor y exporta de nuevo; no se sobrescribió nada.');
if(input.imagenObjetivo!==current.imagenObjetivo)
  throw Error('La referencia de reconocimiento debe permanecer idéntica; cambiarla requiere recompilar targets.mind.');
const dir=path.join(base,'cuadros',input.id,'actualizaciones');
const token=crypto.randomBytes(7).toString('hex');
const additions=[];
const ids=new Set();
const picture=(src,layerId)=>{
  if(typeof src!=='string')throw Error('Imagen de capa inválida');
  if(src.startsWith('data:image/png;base64,')){
    const b64=src.slice('data:image/png;base64,'.length);
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(b64))throw Error('Base64 de PNG inválido');
    const buf=Buffer.from(b64,'base64');
    if(buf.length<32||buf.length>8*1024*1024||!buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      throw Error('PNG inválido o mayor de 8 MB');
    const name=token+'-'+layerId+'.png';
    additions.push({name,buf});
    return './cuadros/'+input.id+'/actualizaciones/'+name;
  }
  if(!/^\.\/[a-zA-Z0-9_./-]+\.(png|webp)$/.test(src)||src.includes('..'))
    throw Error('Ruta PNG no admitida para la capa '+layerId);
  const asset=path.resolve(base,src);
  if(!asset.startsWith(base+path.sep)||!fs.existsSync(asset))throw Error('Falta archivo PNG: '+src);
  return src;
};
const slug=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(s);
const ratio=Number(input.relacionAltoAncho);
if(!Number.isFinite(ratio)||ratio<=0||ratio>5)throw Error('Relación de aspecto inválida');
if(Math.abs(ratio-Number(current.relacionAltoAncho))>.001)throw Error('No cambies la proporción del marcador físico en una actualización');
const layers=input.capas.map(l=>{
  if(!l||!slug(l.id)||ids.has(l.id))throw Error('ID de capa duplicado o inválido');
  ids.add(l.id);
  for(const k of ['ancho','alto','x','y','z','opacidad'])
    if(!Number.isFinite(Number(l[k])))throw Error('Valor no numérico: '+k);
  if(Number(l.ancho)<=0||Number(l.alto)<=0||Math.abs(Number(l.x))>1||Math.abs(Number(l.y))>1||
     Number(l.z)<0||Number(l.z)>1||Number(l.opacidad)<0||Number(l.opacidad)>1)
     throw Error('Valores fuera de rango en la capa '+l.id);
  const a=l.animacion||{},sh=l.sombra||{},p=a.trayectoria||{};
  return {
    id:l.id,nombre:String(l.nombre||l.id).slice(0,100),imagen:picture(l.imagen,l.id),
    ancho:Number(l.ancho),alto:Number(l.alto),x:Number(l.x),y:Number(l.y),z:Number(l.z),
    opacidad:Number(l.opacidad),visible:l.visible!==false,
    rotation:Number(l.rotation)||0,rotationX:Number(l.rotationX)||0,rotationY:Number(l.rotationY)||0,
    pivotX:Math.max(0,Math.min(1,l.pivotX===undefined?.5:Number(l.pivotX))),
    pivotY:Math.max(0,Math.min(1,l.pivotY===undefined?.5:Number(l.pivotY))),
    baseAncho:Number(l.baseAncho)||Number(l.ancho),baseAlto:Number(l.baseAlto)||Number(l.alto),
    escalaUniforme:Number(l.escalaUniforme)||1,escalaX:Number(l.escalaX)||1,escalaY:Number(l.escalaY)||1,
    separacionZ:Number(l.separacionZ)||0,
    sombra:{activo:sh.activo===true,desenfoque:Number(sh.desenfoque)||0,x:Number(sh.x)||0,y:Number(sh.y)||0,opacidad:Number(sh.opacidad)||0},
    animacion:{
      tipo:['ninguna','flotar','pulso','girar','desplazar','balancear','trayectoria'].includes(a.tipo)?a.tipo:'ninguna',
      amplitud:Number(a.amplitud)||0,duracionMs:Number(a.duracionMs)||2000,
      trayectoria:{forma:['circulo','ocho','arco'].includes(p.forma)?p.forma:'circulo',amplitud:Number(p.amplitud)||.35}
    }
  };
});
const updated={
  ...current,
  nombre:String(input.nombre||current.nombre).slice(0,100),
  // Conservar targetIndex, imagenObjetivo y el orden: no recompilamos targets.mind.
  relacionAltoAncho:current.relacionAltoAncho,
  imagenObjetivo:current.imagenObjetivo,targetIndex:current.targetIndex,
  espaciadoCapas:Number.isFinite(Number(input.espaciadoCapas))?Math.max(0,Math.min(.08,Number(input.espaciadoCapas))):current.espaciadoCapas,
  parallax:{activo:input.parallax?.activo===true,intensidad:Math.max(0,Math.min(1,Number(input.parallax?.intensidad)||0))},
  efectoEmergencia:input.efectoEmergencia||current.efectoEmergencia,
  capas:layers
};
catalog.cuadros[index]=updated;
catalog.cacheKey=digest({catalogo:catalog.cuadros.map(x=>[x.id,x.capas.map(l=>l.imagen)]),token}).slice(0,16);
fs.mkdirSync(dir,{recursive:true});
for(const item of additions)fs.writeFileSync(path.join(dir,item.name),item.buf,{flag:'wx'});
const staged=catalogPath+'.tmp';
fs.writeFileSync(staged,JSON.stringify(catalog,null,2)+'\n');
fs.renameSync(staged,catalogPath);
console.log('Actualizado cuadro '+input.id+'; '+layers.length+' capas; referencia y targets.mind intactos.');
