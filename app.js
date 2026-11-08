const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,current=localStorage.getItem('jornada-slot-v04')||'latest',fingerprint='';
let pendingFiles=[],busy=false,revision=0;
let checklistLimit=24;
const regions=['Floresta Kokiri','Bosque Perdido','Prado Sagrado','Campo de Hyrule','Mercado','Castelo de Hyrule','Rancho Lon Lon','Vila Kakariko','Cemitério','Montanha da Morte','Cidade Goron','Cratera da Montanha','Rio Zora','Domínio Zora','Fonte Zora','Lago Hylia','Vale Gerudo','Fortaleza Gerudo','Deserto Assombrado','Colosso do Deserto','Árvore Deku','Caverna Dodongo','Jabu-Jabu','Templo da Floresta','Templo do Fogo','Templo da Água','Templo das Sombras','Templo do Espírito','Fundo do Poço','Caverna de Gelo','Castelo de Ganon'];
const labels={skull:'Skulltulas',heart:'Pedaços de coração',chest:'Baús',other:'Outra descoberta'};
$('#region-options').innerHTML=regions.map(r=>`<option value="${esc(r)}">`).join('');
function tab(id){if(typeof atlasOpenLegacy==='function')atlasOpenLegacy(id);document.querySelectorAll('.page').forEach(e=>e.hidden=e.id!==id);document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('selected',e.dataset.tab===id));}
document.querySelectorAll('[data-tab],[data-go]').forEach(e=>e.onclick=()=>tab(e.dataset.tab||e.dataset.go));
async function localFetch(url,options={},timeout=10000){
 try{return await fetch(url,{...options,signal:AbortSignal.timeout(timeout)});}
 catch(e){if(e.name==='TimeoutError'||e.name==='AbortError')throw Error('O aplicativo demorou para responder. Abra Iniciar.cmd novamente e tente importar outra vez.');throw Error('O aplicativo local está desconectado. Abra Iniciar.cmd novamente e use a página que ele abrir.');}
}
async function api(url,data){const r=await localFetch('/api/'+url,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{},url==='import'?60000:10000);const j=await r.json();if(!r.ok)throw Error(j.error||'Falha na leitura.');return j;}
function selected(){if(current==='latest')return state?.slots.reduce((newest,s)=>!newest||Date.parse(s.modified)>Date.parse(newest.modified)?s:newest,null);return state?.slots.find(s=>s.slot===current);}
function apply(s){state=s;if(typeof atlasConnectionChanged==='function')atlasConnectionChanged(true);const key=JSON.stringify(s.slots.map(x=>[x.slot,x.sha256,x.modified,x.baseline]))+JSON.stringify(s.mappings)+JSON.stringify(s.goals)+s.source+JSON.stringify(s.errors);
 $('#connection').textContent=s.slots.length?`${s.slots.length} slots · ${s.sourceMode==='upload'?'save importado':'monitoramento ativo'}`:'Nenhum save conectado';
 if(key===fingerprint)return;fingerprint=key;
 $('#notice').textContent=s.errors.join('\n');
 if(current!=='latest'&&!s.slots.some(x=>x.slot===current))current='latest';
 $('#slot').innerHTML=s.slots.length?`<option value="latest" ${current==='latest'?'selected':''}>Mais recente (automático)</option>`+s.slots.map(x=>`<option value="${x.slot}" ${x.slot===current?'selected':''}>${x.slot}</option>`).join(''):'<option>Sem save</option>';
 if(document.activeElement!==$('#source'))$('#source').value=s.sourceMode==='upload'?'':s.source;
 $('#source-mode').textContent=s.sourceMode==='upload'&&s.slots.length?'Modo atual: cópia importada. Reimporte após salvar no jogo.':s.source&&s.slots.length?'Modo atual: pasta monitorada automaticamente.':'';
 render();
}
function render(){if(typeof renderAtlas==='function')renderAtlas();const s=selected(),checks=s?.checks||[];
 $('#cards').innerHTML=['skull','heart','chest'].map((c,i)=>{const stat=s?.progress?.counters?.[c],known=stat&&Number.isInteger(stat.collected),pct=known&&stat.total?100*stat.collected/stat.total:0;return `<article class="card"><span class="icon">${['◈','♡','▣'][i]}</span><h3>${labels[c]}</h3><strong>${known?`${stat.collected} <span class="of-total">/ ${stat.total}</span>`:c==='chest'?'Em validação':'Sem leitura'}</strong><progress max="100" value="${pct}" aria-label="Progresso de ${labels[c]}"></progress><div class="remaining">${known?`Faltam <b>${stat.remaining}</b> para completar`:'Contador ainda não identificado'}</div><small>${esc(stat?.source||'Conecte um save para ler o progresso.')}</small></article>`;}).join('');
 $('#save-info').innerHTML=s?`<h2>${esc(s.slot)}</h2><div class="stat-row"><span>Capacidade de vida</span><b>${s.progress?.life?.hearts??'—'} corações</b></div><div class="stat-row"><span>Quartos no inventário</span><b>${s.progress?.life?.quarterRemainder??'—'} / 4</b></div><div class="stat-row"><span>Recipientes de chefes</span><b>${s.progress?.life?.bossContainers??'—'} / 8</b></div><div class="stat-row"><span>Rupias</span><b>${s.progress?.life?.rupees??'—'}</b></div><div class="stat-row"><span>Última gravação</span><b>${new Date(s.modified).toLocaleString('pt-BR')}</b></div><p>${esc(s.progress?.warnings?.join(' ')||s.progress?.warning||'Leitura automática do save. Os totais não dependem de marcação manual.')}</p>`:'<h2>A aventura começa aqui.</h2><p>Conecte a pasta de saves para iniciar a leitura.</p><button id="connect-now" class="primary">Conectar save →</button>';
 $('#connect-now')?.addEventListener('click',()=>tab('settings'));
 const mode=$('#filter').value,category=$('#category-filter').value,filtered=checks.filter(x=>(category==='all'||x.category===category)&&(mode==='all'||(mode==='done'?x.known&&x.done:mode==='unknown'?!x.known:x.known&&!x.done)));
 $('#checks').innerHTML=filtered.length?filtered.slice(0,checklistLimit).map(x=>`<div class="check"><div><span class="badge">${!x.known?'? Em validação':x.done?'✓ Coletado':'○ Pendente'}</span><div>${esc(x.name)}</div><small>${esc(x.region)} · ${labels[x.category]}${x.flag?` · <code>${esc(x.flag)}</code>`:''}</small>${!x.known&&x.reason?`<small>${esc(x.reason)}</small>`:''}</div>${x.automatic?'<span class="badge">Save</span>':`<button class="danger" data-remove="${esc(x.id)}">Remover</button>`}</div>`).join('')+(filtered.length>checklistLimit?`<button id="show-more">Mostrar mais (${filtered.length-checklistLimit} restantes)</button>`:''):'<div class="empty">Nenhum registro nesta seleção.</div>';
 $('#show-more')?.addEventListener('click',()=>{checklistLimit+=24;render();});
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>run(()=>api('remove',{id:b.dataset.remove})));
 const allRegions=[...new Set([...regions,...checks.map(x=>x.region)])];
 $('#region-list').innerHTML=allRegions.filter(r=>checks.some(x=>x.region===r)).map(r=>{const list=checks.filter(x=>x.region===r),done=list.filter(x=>x.known&&x.done).length,unknown=list.filter(x=>!x.known).length;return `<article class="region"><div class="eyebrow">⌖ HYRULE</div><h3>${esc(r)}</h3><small>${done} / ${list.length} coletados${unknown?` · ${unknown} em validação`:''}</small><div class="region-counts">${['skull','heart','chest'].map(c=>{const items=list.filter(x=>x.category===c);return items.length?`${{skull:'◈',heart:'♡',chest:'▣'}[c]} ${items.filter(x=>x.done&&x.known).length}/${items.length}`:'';}).join(' &nbsp; ')}</div></article>`;}).join('')||'<div class="empty">Conecte um save para ver o progresso por região.</div>';
 $('#baseline-info').textContent=s?.baseline?'Referência guardada. Comparando apenas este mesmo slot.':'Nenhuma referência guardada para este slot.';
 $('#change-count').textContent=s?.baseline?`${s.changes.length} flags alteradas`:'';
 $('#changes').innerHTML=s?.changes.length?`<table><thead><tr><th>CÓDIGO</th><th>ANTES</th><th>AGORA</th><th></th></tr></thead><tbody>${s.changes.map(c=>`<tr><td><code>${c.id}</code></td><td>${c.before}</td><td>${c.after}</td><td><button data-pick="${c.id}" data-value="${c.after}">Usar código</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Nenhuma mudança de flag para mostrar.</div>';
 document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const f=$('#mapping-form');f.elements.flag.value=b.dataset.pick;f.elements.value.value=b.dataset.value;f.elements.name.focus();});
 $('#strings').innerHTML=s?.strings.map(x=>`<span>${esc(x)}</span>`).join('')||'Sem referências legíveis.';
 $('#baseline').disabled=!s;
}
async function run(fn,message){revision++;try{apply(await fn());if(message)$('#notice').textContent=message;return true;}catch(e){$('#notice').textContent=e.message;return false;}}
$('#slot').onchange=e=>{current=e.target.value;localStorage.setItem('jornada-slot-v04',current);checklistLimit=24;render();};$('#filter').onchange=()=>{checklistLimit=24;render();};$('#category-filter').onchange=()=>{checklistLimit=24;render();};
$('#source-form').onsubmit=e=>{e.preventDefault();run(async()=>{const s=await api('source',{source:$('#source').value.trim()});current='latest';localStorage.setItem('jornada-slot-v04',current);fingerprint='';return s;},'Pasta conectada. Acompanhe o slot mais recente automaticamente em Minha jornada.');};
$('#baseline').onclick=()=>run(()=>api('baseline',{slot:selected()?.slot}));
$('#mapping-form').onsubmit=e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));b.flag=b.flag.toLowerCase();b.value=Number(b.value);run(async()=>{const result=await api('mapping',b);e.target.reset();return result;});};
$('#choose-files').onclick=()=>$('#save-files').click();
$('#choose-folder').onclick=()=>$('#save-folder').click();
function choose(files){pendingFiles=Array.from(files);$('#upload-selection').textContent=pendingFiles.length?`${pendingFiles.length} arquivo(s) selecionado(s): ${pendingFiles.slice(0,4).map(f=>f.name).join(', ')}${pendingFiles.length>4?'…':''}`:'Nenhum arquivo selecionado.';$('#import-save').disabled=!pendingFiles.length;}
$('#save-files').onchange=e=>{if(e.target.files.length)choose(e.target.files);e.target.value='';};
$('#save-folder').onchange=e=>{if(e.target.files.length)choose(e.target.files);e.target.value='';};
function base64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Não foi possível ler '+file.name));reader.readAsDataURL(file);});}
$('#upload-form').onsubmit=async e=>{
 e.preventDefault();if(busy||!pendingFiles.length)return;busy=true;revision++;
 $('#import-save').disabled=true;$('#import-save').textContent='Importando…';document.querySelectorAll('[data-upload-picker]').forEach(b=>b.disabled=true);
 $('#notice').textContent='Lendo e validando seu save…';
 try{
  let result,targetSlot=$('#upload-slot').value;
  if(pendingFiles.length===1&&/\.(zip|rar)$/i.test(pendingFiles[0].name)){
   const f=pendingFiles[0];if(f.size>32*1024*1024)throw Error('O ZIP/RAR deve ter no máximo 32 MB. Extraia e selecione a pasta se necessário.');
   const response=await localFetch('/api/archive?'+new URLSearchParams({name:f.name,slot:targetSlot}),{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:f},60000);
   result=await response.json();if(!response.ok)throw Error(result.error||'Falha ao importar o arquivo.');
  }else{
   const files=pendingFiles.filter(f=>f.name.toLowerCase()==='progress.sav');
   if(!files.length)throw Error('Selecione progress.sav, a pasta que contém os slots ou um ZIP/RAR do save.');
   if(files.length>6)throw Error('Selecione somente a pasta de um jogo, com no máximo seis slots.');
   const payload=[];
   for(const f of files){
    if(f.size>8*1024*1024)throw Error('progress.sav maior que o esperado (limite de 8 MB).');
    const match=(f.webkitRelativePath||'').replace(/\\/g,'/').match(/(?:^|\/)(slot_0[0-5])\/progress\.sav$/i);
    if(!match&&files.length>1)throw Error('Para vários progress.sav, use Escolher pasta para identificar os slots.');
    payload.push({slot:match?match[1].toLowerCase():targetSlot,data:await base64(f)});
   }
   if(new Set(payload.map(f=>f.slot)).size!==payload.length)throw Error('Há slots repetidos. Selecione apenas a pasta de um jogo.');
   targetSlot=payload[0].slot;result=await api('import',{files:payload});
  }
  current=result.slots.some(s=>s.slot===targetSlot)?targetSlot:result.slots[0]?.slot||current;
  localStorage.setItem('jornada-slot-v04',current);fingerprint='';apply(result);choose([]);
  $('#notice').textContent=`Save importado com sucesso. ${result.slots.length} slot(s) disponível(is). Para atualizar o progresso após jogar, importe novamente.`;
  tab('journey');
 }catch(error){$('#notice').textContent=error.message;}
 finally{busy=false;revision++;$('#import-save').disabled=!pendingFiles.length;$('#import-save').textContent='Importar save';document.querySelectorAll('[data-upload-picker]').forEach(b=>b.disabled=false);}
};
async function poll(){const started=revision;try{if(!busy){const s=await api('state');if(started===revision&&!busy)apply(s);}}catch(e){if(started===revision&&!busy){if(typeof atlasConnectionChanged==='function')atlasConnectionChanged(false);$('#connection').textContent='Servidor desconectado';$('#notice').textContent=e.message;}}finally{setTimeout(poll,4000);}}poll();
