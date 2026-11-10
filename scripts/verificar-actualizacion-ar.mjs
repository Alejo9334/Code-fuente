#!/usr/bin/env node
// Prueba aislada: conserva la referencia AR y otros cuadros; rechaza versiones antiguas.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'prueba-update-ar-'));
try{
  fs.mkdirSync(path.join(root,'scripts'),{recursive:true});
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.mkdirSync(path.join(root,'proyectos','actualizaciones'),{recursive:true});
  fs.copyFileSync('scripts/actualizar-cuadro.mjs',path.join(root,'scripts','actualizar-cuadro.mjs'));
  const picture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Yd+T7UAAAAASUVORK5CYII=','base64');
  fs.writeFileSync(path.join(root,'public','referencia.jpg'),'marcador fijo');
  fs.writeFileSync(path.join(root,'public','targets.mind'),'reconocimiento intacto');
  fs.writeFileSync(path.join(root,'public','capa.png'),picture);
  const current={id:'carnet',nombre:'Carnet',targetIndex:1,relacionAltoAncho:1,
    imagenObjetivo:'./referencia.jpg',capas:[{id:'capa-1',imagen:'./capa.png',ancho:1,alto:1,x:0,y:0,z:0,opacidad:1}]};
  const neighbor={id:'otro-cuadro',nombre:'Otro',targetIndex:0,relacionAltoAncho:1,imagenObjetivo:'./referencia.jpg',capas:[]};
  const catalog={version:3,archivoMind:'./targets.mind',cuadros:[neighbor,current],compilador:{cantidadObjetivos:2}};
  fs.writeFileSync(path.join(root,'public','catalogo.json'),JSON.stringify(catalog));
  const hash=crypto.createHash('sha256').update(JSON.stringify(current)).digest('hex');
  const req={operacion:'actualizar',baseHash:hash,cuadros:[{...current,nombre:'Carnet corregido',
    capas:[current.capas[0],{id:'capa-nueva',nombre:'Nueva capa',imagen:'data:image/png;base64,'+picture.toString('base64'),
      ancho:1,alto:1,x:0,y:0,z:.3,opacidad:1,visible:true,rotationX:12,rotationY:5,rotation:3,
      pivotX:.5,pivotY:.5,sombra:{activo:true,desenfoque:6,x:2,y:4,opacidad:55},
      animacion:{tipo:'trayectoria',trayectoria:{forma:'circulo',amplitud:.25},duracionMs:1800}}]}]};
  const file='proyectos/actualizaciones/prueba.json';
  fs.writeFileSync(path.join(root,file),JSON.stringify(req));
  const command=()=>spawnSync(process.execPath,['scripts/actualizar-cuadro.mjs',file,'public'],{cwd:root,encoding:'utf8'});
  const first=command();
  if(first.status!==0)throw Error('Primera actualización falló: '+first.stderr);
  const result=JSON.parse(fs.readFileSync(path.join(root,'public','catalogo.json'),'utf8'));
  if(result.cuadros.length!==2||JSON.stringify(result.cuadros[0])!==JSON.stringify(neighbor))
    throw Error('Se alteraron otros cuadros');
  const carnet=result.cuadros[1];
  if(carnet.capas.length!==2||carnet.targetIndex!==1||carnet.imagenObjetivo!=='./referencia.jpg')
    throw Error('No se conservó el objetivo o no se agregó la capa');
  if(carnet.capas[1].rotationX!==12||!carnet.capas[1].sombra.activo||carnet.capas[1].animacion.tipo!=='trayectoria')
    throw Error('Se perdieron propiedades nuevas');
  if(!fs.existsSync(path.join(root,'public',carnet.capas[1].imagen)))throw Error('No se escribió la imagen nueva');
  if(fs.readFileSync(path.join(root,'public','targets.mind'),'utf8')!=='reconocimiento intacto')
    throw Error('Se modificó targets.mind');
  const second=command();
  if(second.status===0||!second.stderr.includes('cambió desde'))
    throw Error('No se rechazó una actualización obsoleta');
  console.log('Prueba OK: actualiza Carnet, preserva otra obra y el marcador AR; rechaza versiones antiguas.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
