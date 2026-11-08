const catalog=require('./catalog.json');
const skullDetails=require('./skull-details.json');
const HEX=n=>n.toString(16).padStart(8,'0');
const scalarIds={skull:0x04735978,quarters:0x51ec97b3,maxLife:0xfbe01da1,life:0x31ab5580,rupees:0xa77921d7};
function readProgress(version,records,flags,guids,buffer){
 if(version!==catalog.revision)return {supported:false,warning:'Esta revisão do save ainda não tem um catálogo validado.',checks:[],counters:{}};
 const seen=new Set(guids),ints={};
 for(const [name,key]of Object.entries(scalarIds)){const entry=records[HEX(key)];ints[name]=entry?.section===2?entry.value:null;}
 const valid=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
 const skullCount=valid(ints.skull,100)?ints.skull:null;
 const bossCount=catalog.bossContainers.filter(id=>seen.has(id)).length;
 const maxHearts=valid(ints.maxLife,80)&&ints.maxLife>=12&&ints.maxLife%4===0?ints.maxLife/4:null;
 let heartCount=maxHearts!==null&&valid(ints.quarters,3)?(maxHearts-3-bossCount)*4+ints.quarters:null;
 if(!valid(heartCount,36))heartCount=null;
 const ordinals={};
 function check(category,item,status,reason){const key=category+item.region;const ordinal=ordinals[key]=(ordinals[key]||0)+1;return {id:'auto-'+category+'-'+item.id,category,name:({skull:'Skulltula',heart:'Pedaço de coração',chest:'Baú'}[category])+' '+ordinal,region:item.region,position:item.position,done:status===true,known:status!==null,automatic:true,reason,contents:item.contents||null};}
 const skullChecks=catalog.skulls.map(item=>{
  const body=seen.has(item.id),other=seen.has((BigInt(item.id)^2n).toString());
  return {...check('skull',item,body===other?body:null,body!==other?'Registro de derrota/coleta divergente; confirme a coleta do token.':'Registro persistente do local.'),detail:skullDetails[item.id]||null};
 });
 const heartChecks=catalog.hearts.map(item=>{
  let done=null,reason='Registro de coleta não disponível neste arquivo.';
  if(item.kind==='flag'){done=Object.hasOwn(flags,item.flag)?flags[item.flag]===1:null;reason='Flag de recompensa definida pelo jogo.';}
  else if(item.kind==='actor'){done=item.targets.length?item.targets.some(id=>seen.has(id)):null;reason='Registro persistente de coleta do objeto.';}
  else if(item.kind==='chest'&&item.chestFlags?.length){done=item.chestFlags.every(f=>Object.hasOwn(flags,f))?item.chestFlags.some(f=>flags[f]===1):null;reason='Registro permanente de abertura do baú que contém este pedaço.';}
  return check('heart',item,done,reason);
 });
 const chestChecks=catalog.chests.map(item=>check('chest',item,Object.hasOwn(flags,item.flag)?flags[item.flag]===1:null,'Registro permanente de abertura do baú.'));
 const confirmed=heartChecks.filter(x=>x.known&&x.done).length,unknown=heartChecks.filter(x=>!x.known).length;
 const warnings=[];
 if(heartCount!==null&&(heartCount<confirmed||heartCount>confirmed+unknown)){warnings.push('Os registros individuais de coração divergem da capacidade de vida; o total foi ocultado para evitar uma contagem incorreta.');heartCount=null;}
 const registeredSkulls=skullChecks.filter(x=>x.done).length;
 if(skullCount!==null&&registeredSkulls!==skullCount)warnings.push('O inventário e os locais de Skulltulas divergem. O contador usa o inventário; confira as entradas individuais.');
 const chestRecord=records['4766a777'];let chestCount=null;
 if(chestRecord?.section===22&&chestRecord.value>=0&&chestRecord.value+8<=buffer.length){const n=buffer.readBigInt64LE(chestRecord.value);if(n>=0n&&n<=BigInt(catalog.chests.length))chestCount=Number(n);}
 const chestConfirmed=chestChecks.filter(x=>x.done).length,chestUnknown=chestChecks.filter(x=>!x.known).length;
 const playtimeRecord=records['ce97845e'];let playtimeSeconds=null;
 if(playtimeRecord?.section===22&&playtimeRecord.value>=0&&playtimeRecord.value+8<=buffer.length){const n=buffer.readBigInt64LE(playtimeRecord.value);if(n>=0n&&n<=315576000n)playtimeSeconds=Number(n);}
 if(chestCount!==null&&(chestUnknown||chestConfirmed!==chestCount)){warnings.push('O total de baús diverge dos registros individuais; a contagem foi ocultada para evitar um resultado incorreto.');chestCount=null;}
 return {supported:true,warnings,playtime:{seconds:playtimeSeconds,source:'Tempo acumulado de jogo registrado no save (PlayTime).'},checks:[...skullChecks,...heartChecks,...chestChecks],life:{hearts:maxHearts,current:valid(ints.life,80)?ints.life/4:null,bossContainers:bossCount,quarterRemainder:valid(ints.quarters,3)?ints.quarters:null,rupees:valid(ints.rupees,9999)?ints.rupees:null},counters:{
  skull:{collected:skullCount,total:100,remaining:skullCount===null?null:100-skullCount,source:'Inventário: tokens de Skulltulas douradas.'},
  heart:{collected:heartCount,total:36,remaining:heartCount===null?null:36-heartCount,source:'Coletas conferidas com a capacidade de vida, os recipientes dos chefes e os quartos restantes.',individualConfirmed:confirmed,individualUnknown:unknown},
  chest:{collected:chestCount,total:catalog.chests.length,remaining:chestCount===null?null:catalog.chests.length-chestCount,source:'Contador do jogo conferido com os '+catalog.chests.length+' registros de abertura de baús.',individualConfirmed:chestConfirmed,individualUnknown:chestUnknown}
 }};
}
module.exports={readProgress};
