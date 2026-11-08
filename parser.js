const crypto = require('node:crypto');
const {readProgress}=require('./progress');
function parseSave(b) {
  if (!Buffer.isBuffer(b) || b.length < 48 || b.length > 8*1024*1024) throw Error('Tamanho de save inválido.');
  if (b.readUInt32LE(0) !== 0x01020304) throw Error('Cabeçalho não reconhecido. Use progress.sav do OOT NS2.');
  const end = b.readUInt32LE(8);
  if (end < 48 || end > b.length || end % 8) throw Error('Tabela do save inválida ou incompleta.');
  const flags = {}; let stop = -1;
  for (let p=40;p+8<=end;p+=8) {
    const key=b.readUInt32LE(p), value=b.readUInt32LE(p+4);
    if(key===0) { if(value!==1) throw Error('Estrutura de flags desconhecida.'); stop=p; break; }
    if(value>1) throw Error('Tabela de flags incompatível.');
    const id=key.toString(16).padStart(8,'0');
    if(id in flags) throw Error('Chaves duplicadas no save.');
    flags[id]=value;
  }
  if(stop<0) throw Error('Tabela de flags incompleta.');
  const records={};let section=0,guidOffset=null;
  for(let p=40;p+8<=end;p+=8){
    const hash=b.readUInt32LE(p),value=b.readUInt32LE(p+4);
    if(!hash){if(value!==section+1||value>32)throw Error('Seções do save incompatíveis.');section=value;continue;}
    const id=hash.toString(16).padStart(8,'0');if(Object.hasOwn(records,id))throw Error('Registro duplicado.');
    records[id]={section,value:section===2?b.readInt32LE(p+4):value};
    if(hash===0xa3db7114)guidOffset=value;
  }
  if(guidOffset===null||guidOffset<end||guidOffset>b.length||(b.length-guidOffset)%8)throw Error('Lista de registros persistentes inválida.');
  const guids=[];for(let p=guidOffset;p+8<=b.length;p+=8)guids.push(b.readBigUInt64LE(p).toString());
  const progress=readProgress(b.readUInt32LE(4),records,flags,guids,b);
  // Strings are evidence from the file, not decoded inventory ownership.
  const strings=[...new Set((b.toString('latin1').match(/[A-Za-z][A-Za-z0-9_/.]{7,}/g)||[])
    .filter(s=> /^(Item_|Armor_|Weapon_|Animal_)/.test(s) || /^(Hyrule|Kokiri|Goron|SpiritTemple|Zora|Desert|Kakariko)/.test(s)))];
  return {sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length,version:b.readUInt32LE(4),flags,strings,progress};
}
function diff(a,b){return Object.keys(b.flags).filter(k=>k in a.flags && a.flags[k]!==b.flags[k]).map(id=>({id,before:a.flags[id],after:b.flags[id]}));}
module.exports={parseSave,diff};
