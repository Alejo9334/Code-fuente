(function(){
  'use strict';
  var config=window.VISOR222_AUTH_CONFIG||{};
  var client=null;
  function configured(){
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url||'') &&
      typeof config.anonKey==='string' && config.anonKey.length>20;
  }
  function getClient(){
    if(!configured())throw Error('Autenticación aún no configurada. Solicita al administrador la URL y clave pública de Supabase.');
    if(!window.supabase || !window.supabase.createClient)throw Error('No se pudo cargar el servicio de autenticación.');
    if(!client)client=window.supabase.createClient(config.url,config.anonKey,{
      auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}
    });
    return client;
  }
  async function administrator(){
    var sb=getClient();
    // getUser verifica el JWT con Supabase Auth; getSession por sí solo no basta.
    var response=await sb.auth.getUser();
    if(response.error||!response.data||!response.data.user)return null;
    var id=response.data.user.id;
    var result=await sb.from('visor222_admins').select('user_id').eq('user_id',id).maybeSingle();
    if(result.error)throw Error('No se pudo verificar el permiso de administrador: '+result.error.message);
    return result.data?response.data.user:null;
  }
  async function requireAdmin(){
    try{
      var user=await administrator();
      if(!user){location.replace('./login.html?reason=access');return null;}
      document.documentElement.classList.add('admin-verified');
      return user;
    }catch(err){
      location.replace('./login.html?reason=config');
      return null;
    }
  }
  async function onReady(callback){
    var user=await requireAdmin();
    if(user)await callback(user);
  }
  async function signIn(email,password){
    var sb=getClient();
    var result=await sb.auth.signInWithPassword({email:email,password:password});
    if(result.error)throw Error('Credenciales incorrectas o cuenta no habilitada.');
    var user=await administrator();
    if(!user){await sb.auth.signOut();throw Error('La cuenta no tiene permiso de administrador.');}
    return user;
  }
  async function signOut(){
    try {await getClient().auth.signOut();} finally {location.replace('./login.html');}
  }
  async function saveProject(data){
    var admin=await administrator();
    if(!admin)throw Error('Sesión administrativa no autorizada.');
    var sb=getClient();
    var serialized=JSON.stringify(data);
    if(serialized.length>8*1024*1024)throw Error('Proyecto demasiado grande para guardarlo en la nube. Descarga JSON como respaldo y publica los PNG por separado.');
    var response=await sb.from('visor222_admin_projects').upsert({
      id:'catalogo-principal',
      project:data,
      updated_by:admin.id
    },{onConflict:'id'});
    if(response.error)throw Error('No se pudo guardar en Supabase: '+response.error.message);
  }
  async function loadProject(){
    var admin=await administrator();
    if(!admin)throw Error('Sesión administrativa no autorizada.');
    var response=await getClient().from('visor222_admin_projects')
      .select('project,updated_at').eq('id','catalogo-principal').maybeSingle();
    if(response.error)throw Error('No se pudo recuperar el proyecto: '+response.error.message);
    return response.data;
  }
  window.VISOR222_ADMIN=Object.freeze({
    configured:configured, getClient:getClient, administrator:administrator,
    requireAdmin:requireAdmin, onReady:onReady, signIn:signIn, signOut:signOut,
    saveProject:saveProject, loadProject:loadProject
  });
})();
