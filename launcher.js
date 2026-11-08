const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fork,spawn}=require('node:child_process');
const BASE=__dirname,DATA=path.join(BASE,'dados'),VERSION='0.6';
const instance=crypto.createHash('sha256').update(BASE.toLowerCase()).digest('hex').slice(0,16);
function open(url){
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(url))throw Error('Endereço do aplicativo inválido.');
 fs.writeFileSync(path.join(BASE,'Abrir no navegador.url'),'[InternetShortcut]\r\nURL='+url+'\r\n');
 if(!process.env.JORNADA_NO_OPEN){
  const browser=spawn('explorer.exe',[url],{windowsHide:true,stdio:'ignore'});
  browser.once('error',e=>console.error('Nao foi possivel abrir o navegador: '+e.message+'\nAbra o atalho "Abrir no navegador" ou copie o endereco acima.'));
  browser.unref();
 }
 console.log('Servidor pronto: '+url+'\nSe a pagina nao abriu, use o atalho "Abrir no navegador" nesta pasta.\nO aplicativo continua ativo apos fechar esta janela.');
}
async function launch(){
 fs.mkdirSync(DATA,{recursive:true});
 try{
  const old=JSON.parse(fs.readFileSync(path.join(DATA,'runtime.json'),'utf8'));
  if(/^http:\/\/127\.0\.0\.1:\d+$/.test(old.url)){
   const health=await(await fetch(old.url+'/api/health',{signal:AbortSignal.timeout(1500)})).json();
   if(health.app==='jornada-hyrule'&&health.version===VERSION&&health.instance===instance){
    if(process.argv.includes('--stop')){await fetch(old.url+'/api/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(3000)});console.log('Aplicativo encerrado.');return;}
    open(old.url);return;
   }
  }
 }catch{}
 if(process.argv.includes('--stop')){console.log('Nenhuma instância desta versão está ativa.');return;}
 const log=fs.openSync(path.join(DATA,'servidor.log'),'a');
 const child=fork(path.join(BASE,'server.js'),[],{cwd:BASE,detached:true,windowsHide:true,stdio:['ignore',log,log,'ipc'],env:{...process.env,JORNADA_NO_OPEN:'1',JORNADA_PORT:'0'}});
 fs.closeSync(log);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{if(child.connected)child.disconnect();child.unref();reject(Error('O aplicativo não iniciou em 15 segundos. Consulte dados/servidor.log.'));},15000);
  child.once('error',e=>{clearTimeout(timer);reject(e);});
  child.once('exit',code=>{clearTimeout(timer);reject(Error('O servidor encerrou ao iniciar (código '+code+'). Consulte dados/servidor.log.'));});
  child.once('message',message=>{
   if(!message.ready)return;clearTimeout(timer);child.disconnect();child.unref();
   try{open(message.url);resolve();}catch(e){reject(e);}
  });
 });
}
launch().catch(e=>{console.error(e.message);process.exitCode=1;});
