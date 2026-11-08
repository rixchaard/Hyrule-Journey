const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {parseSave,diff}=require('./parser');
const {promisify}=require('node:util');
const execFile=promisify(require('node:child_process').execFile);
const BASE=__dirname,DATA=path.join(BASE,'dados'); fs.mkdirSync(DATA,{recursive:true});
const APP_VERSION='0.6',INSTANCE=require('node:crypto').createHash('sha256').update(BASE.toLowerCase()).digest('hex').slice(0,16);
const configPath=path.join(DATA,'config.json');
let config={source:'',mappings:[],goals:{skull:100,heart:36,chest:0}};
if(fs.existsSync(configPath)) config={...config,...JSON.parse(fs.readFileSync(configPath,'utf8'))};
let latest={},errors=[],lastScan=null;
function persist(){fs.writeFileSync(configPath,JSON.stringify(config,null,2));}
function setSource(source){
 if(source!==config.source){config.source=source; latest={};for(let n=0;n<6;n++){const f=snapFile('slot_'+String(n).padStart(2,'0'));if(fs.existsSync(f))fs.unlinkSync(f);}}
 persist();
}
function sourceFolder(input){
 if(typeof input!=='string'||!input.trim())throw Error('Informe a pasta do save ou use Importar save acima.');
 let source=input.trim().replace(/^["']|["']$/g,'').replace(/%(APPDATA|LOCALAPPDATA|USERPROFILE)%/gi,(_,key)=>process.env[key.toUpperCase()]||'%'+key+'%');
 if(!path.isAbsolute(source))throw Error('Use o caminho completo da pasta ou clique em Escolher arquivos.');
 source=path.resolve(source);
 if(!fs.existsSync(source))throw Error('Pasta não encontrada neste computador. Use Escolher arquivos para importar seu save.');
 if(fs.statSync(source).isFile()){
  if(path.basename(source).toLowerCase()!=='progress.sav')throw Error('Para ZIP ou RAR, use Importar save. Para monitorar, escolha a pasta do jogo.');
  source=path.dirname(source);
 }
 if(/^slot_0[0-5]$/.test(path.basename(source)))source=path.dirname(source);
 const files=Array.from({length:6},(_,n)=>path.join(source,'slot_'+String(n).padStart(2,'0'),'progress.sav')).filter(f=>fs.existsSync(f));
 if(!files.length)throw Error('Não achei progress.sav nos slots desta pasta. Use Escolher pasta ou Escolher arquivos acima.');
 // Validate before replacing an existing working connection.
 for(const file of files)parseSave(fs.readFileSync(file));
 return source;
}
function importFiles(files){
 if(!Array.isArray(files)||!files.length||files.length>6)throw Error('Selecione de 1 a 6 arquivos progress.sav.');
 const seen=new Set();
 const validated=files.map(f=>{
  if(!/^slot_0[0-5]$/.test(f.slot)||seen.has(f.slot))throw Error('Slots inválidos ou repetidos na seleção. Importe uma pasta de jogo por vez.');
  seen.add(f.slot);
  if(!Buffer.isBuffer(f.buffer))throw Error('Conteúdo inválido.');
  parseSave(f.buffer);return f;
 });
 const source=path.join(DATA,'importados');fs.mkdirSync(source,{recursive:true});
 for(const f of validated){const dir=path.join(source,f.slot);fs.mkdirSync(dir,{recursive:true});const tmp=path.join(dir,'progress.sav.tmp');fs.writeFileSync(tmp,f.buffer);fs.renameSync(tmp,path.join(dir,'progress.sav'));}
 setSource(source);
}
async function archiveFiles(buffer,name,slot){
 if(!/\.(zip|rar)$/i.test(name))throw Error('Escolha um ZIP, RAR ou os arquivos progress.sav.');
 if(!/^slot_0[0-5]$/.test(slot))throw Error('Slot inválido.');
 const temp=fs.mkdtempSync(path.join(DATA,'upload-')),file=path.join(temp,'save'+path.extname(name).toLowerCase());
 try{
  fs.writeFileSync(file,buffer);
  let listing;
  try{listing=(await execFile('tar',['-tf',file],{maxBuffer:1024*1024,timeout:15000,windowsHide:true})).stdout;}
  catch{throw Error('Não foi possível abrir o ZIP/RAR. Extraia no Windows e use Escolher pasta ou selecione progress.sav.');}
  const entries=listing.split(/\r?\n/).filter(Boolean).filter(entry=>{
   const clean=entry.replace(/\\/g,'/');
   return !clean.startsWith('/')&&!clean.startsWith('-')&&!clean.split('/').some(p=>p==='..'||p.includes(':'))&&/(^|\/)progress\.sav$/i.test(clean);
  });
  if(!entries.length||entries.length>6)throw Error('O arquivo deve conter entre 1 e 6 arquivos progress.sav, de uma única pasta de jogo.');
  const result=[];
  for(const entry of entries){
   const match=entry.replace(/\\/g,'/').match(/(?:^|\/)(slot_0[0-5])\/progress\.sav$/i);
   if(!match&&entries.length>1)throw Error('Não consegui identificar os slots. Preserve as pastas slot_00 a slot_05 no ZIP/RAR.');
   let output;
   try{output=(await execFile('tar',['-xOf',file,'--',entry],{encoding:'buffer',maxBuffer:8*1024*1024,timeout:15000,windowsHide:true})).stdout;}
   catch{throw Error('Não consegui ler progress.sav. Extraia o arquivo e selecione-o diretamente.');}
   result.push({slot:match?match[1].toLowerCase():slot,buffer:output});
  }
  return result;
 }finally{if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(temp);}
}
function snapFile(slot){return path.join(DATA,slot+'-baseline.json');}
function baseline(slot){try{return JSON.parse(fs.readFileSync(snapFile(slot),'utf8'));}catch{return null;}}
function scan(){
 errors=[]; const found={};
 if(config.source&&!fs.existsSync(config.source))errors.push('A pasta conectada não está disponível. Importe o save em Conectar save.');
 if(config.source) for(let n=0;n<6;n++){
  const slot='slot_'+String(n).padStart(2,'0'),file=path.join(config.source,slot,'progress.sav');
  try{if(!fs.existsSync(file))continue; const before=fs.statSync(file);const buf=fs.readFileSync(file);const after=fs.statSync(file);
   if(before.mtimeMs!==after.mtimeMs||before.size!==after.size)throw Error('Save sendo gravado; tentando novamente.');
   const parsed=parseSave(buf); const previous=latest[slot];
   if(previous&&previous.sha256===parsed.sha256){found[slot]={...previous,modified:after.mtime.toISOString()};continue;}
   found[slot]={...parsed,slot,modified:after.mtime.toISOString()};
  }catch(e){errors.push(slot+': '+e.message);if(latest[slot])found[slot]=latest[slot];}
 }
 if(config.source&&!Object.keys(found).length&&!errors.length)errors.push('Nenhum slot encontrado na pasta conectada. Importe um progress.sav em Conectar save.');
 latest=found;lastScan=new Date().toISOString();
}
function state(){scan();return {source:config.source,sourceMode:config.source===path.join(DATA,'importados')?'upload':'folder',goals:config.goals,mappings:config.mappings,errors,lastScan,slots:Object.values(latest).map(s=>{
 const base=baseline(s.slot),changes=base?diff(base,s):[];
 return {slot:s.slot,sha256:s.sha256,bytes:s.bytes,modified:s.modified,strings:s.strings,progress:s.progress,flagCount:Object.keys(s.flags).length,active:Object.values(s.flags).filter(Boolean).length,baseline:base?base.sha256:null,changes,checks:[...(s.progress?.checks||[]),...config.mappings.map(m=>({...m,done:s.flags[m.flag]===m.value,known:m.flag in s.flags}))]};})};}
async function bytes(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Error('Arquivo grande demais. Use os progress.sav ou um ZIP/RAR de até 32 MB.');chunks.push(chunk);}return Buffer.concat(chunks);}
async function body(req,limit=65536){return JSON.parse((await bytes(req,limit)).toString('utf8')||'{}');}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const respond=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
 if(req.headers.host!==`127.0.0.1:${server.address().port}`&&req.headers.host!==`localhost:${server.address().port}`)return respond(403,{error:'Host inválido.'});
 if(req.method==='POST'){
  if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`)return respond(403,{error:'Origem inválida.'});
  if(url.pathname==='/api/stop'){
   if(!String(req.headers['content-type']).startsWith('application/json'))return respond(415,{error:'Use JSON.'});
   await body(req);respond(200,{stopped:true});
   setTimeout(()=>{server.close();server.closeAllConnections();},200);return;
  }
  if(url.pathname==='/api/archive'){
   if(req.headers['content-type']!=='application/octet-stream')return respond(415,{error:'Formato de upload inválido.'});
   const files=await archiveFiles(await bytes(req,32*1024*1024),url.searchParams.get('name')||'',url.searchParams.get('slot')||'slot_00');
   importFiles(files);return respond(200,state());
  }
  if(!String(req.headers['content-type']).startsWith('application/json'))return respond(415,{error:'Use JSON.'});
  const b=await body(req,url.pathname==='/api/import'?68*1024*1024:65536);
  if(url.pathname==='/api/source'){
   setSource(sourceFolder(b.source));
  }else if(url.pathname==='/api/import'){
   if(!Array.isArray(b.files)||!b.files.length||b.files.length>6)throw Error('Selecione de 1 a 6 arquivos progress.sav.');
   importFiles(b.files.map(f=>{
    if(typeof f.data!=='string'||f.data.length>12*1024*1024||/[^A-Za-z0-9+/=]/.test(f.data))throw Error('Conteúdo do arquivo inválido.');
    const buffer=Buffer.from(f.data,'base64');if(buffer.toString('base64')!==f.data)throw Error('Conteúdo do arquivo inválido.');
    return {slot:f.slot,buffer};
   }));
  }else if(url.pathname==='/api/baseline'){
   scan();if(!latest[b.slot])throw Error('Slot inválido.');fs.writeFileSync(snapFile(b.slot),JSON.stringify(latest[b.slot]));
  }else if(url.pathname==='/api/mapping'){
   if(!/^[0-9a-f]{8}$/.test(b.flag)||![0,1].includes(b.value)||!['skull','heart','chest','other'].includes(b.category)||typeof b.name!=='string'||!b.name.trim()||b.name.length>160||typeof b.region!=='string'||b.region.length>100)throw Error('Associação inválida.');
   if(!Object.values(latest).some(s=>b.flag in s.flags))throw Error('Flag ausente dos saves.');
   if(config.mappings.some(m=>m.flag===b.flag))throw Error('Esse código já está associado.');
   config.mappings.push({id:require('node:crypto').randomUUID(),flag:b.flag,value:b.value,category:b.category,name:b.name.trim(),region:b.region.trim()||'Sem região'});persist();
  }else if(url.pathname==='/api/remove') {config.mappings=config.mappings.filter(m=>m.id!==b.id);persist();
  }else if(url.pathname==='/api/goals'){
   for(const k of ['skull','heart','chest'])if(!Number.isInteger(b[k])||b[k]<0||b[k]>10000)throw Error('Meta inválida.');
   config.goals={skull:b.skull,heart:b.heart,chest:b.chest};persist();
  }else return respond(404,{error:'Rota desconhecida.'});
  return respond(200,state());
 }
 if(req.method!=='GET')return respond(405,{error:'Método inválido.'});
 if(url.pathname==='/api/health')return respond(200,{app:'jornada-hyrule',version:APP_VERSION,instance:INSTANCE});
 if(url.pathname==='/api/state')return respond(200,state());
 const assets={'/':'index.html','/app.js':'app.js','/skulls.js':'skulls.js','/style.css':'style.css','/atlas.css':'atlas.css','/atlas.js':'atlas.js','/collect-audio.js':'collect-audio.js','/atlas-data.json':'atlas-data.json'};const f=assets[url.pathname]||(/^\/assets\/[A-Za-z0-9_-]+\.(webp|png|svg|woff2|ttf|mp3)$/.test(url.pathname)?url.pathname.slice(1):null);
 if(!f||!fs.existsSync(path.join(BASE,f)))return respond(404,{error:'Não encontrado.'});
 res.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':f.endsWith('.png')?'image/png':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.mp3')?'audio/mpeg':f.endsWith('.ttf')?'font/ttf':f.endsWith('.woff2')?'font/woff2':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'"});fs.createReadStream(path.join(BASE,f)).pipe(res);
 }catch(e){respond(400,{error:e.message});}
});
server.listen(Number(process.env.JORNADA_PORT)||0,'127.0.0.1',()=>{
 const address=`http://127.0.0.1:${server.address().port}`;console.log('Jornada de Hyrule: '+address+'\nMantenha esta janela aberta. Ctrl+C para encerrar.');
 fs.writeFileSync(path.join(DATA,'runtime.json'),JSON.stringify({url:address,pid:process.pid,version:APP_VERSION}));
 if(process.send)process.send({ready:true,url:address,version:APP_VERSION});
 if(!process.env.JORNADA_NO_OPEN)require('node:child_process').spawn('cmd.exe',['/c','start','',address],{windowsHide:true,stdio:'ignore'}).unref();
});
module.exports=server;
