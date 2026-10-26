/* Offline, dependency-free text reports and real OOXML Word documents. */
(() => {
 'use strict';
 if(window.NursingLearningExport)return;
 const BEGIN='===== ICE_NURSING_BACKUP_JSON_BEGIN =====',END='===== ICE_NURSING_BACKUP_JSON_END =====';
 const decode=v=>{try{return JSON.parse(v);}catch(_){return v;}};
 const printable=v=>typeof v==='string'?v:typeof v==='number'||typeof v==='boolean'?String(v):'';
 function report(snapshot){
  const rows=[],add=(text,style='Normal')=>rows.push({text:String(text),style}),data=snapshot.learning,records=snapshot.records||{},events=data.events||[];
  add('护理学习记录','Title');add('ice冰冰·高分学姐团');add('导出时间：'+new Date(snapshot.exportedAt).toLocaleString('zh-CN'));
  add('这份文档整理了本设备的学习概况、每日记录与笔记，供复盘和打印。完整恢复请选择 JSON 备份，或保留 TXT 末尾的完整恢复数据。');
  add('学习概况','Heading1');const objective=events.filter(e=>e.kind==='objective'),correct=objective.filter(e=>e.ok).length;
  add(`累计作答 ${events.length} 次，其中客观练习 ${objective.length} 次，自评回忆 ${events.length-objective.length} 次。`);
  add('客观练习正确率：'+(objective.length?Math.round(correct/objective.length*100)+'%':'暂无作答')+'。包含重复练习，不代表考试成绩。');
  let seconds=0;for(const [key,value] of Object.entries(records)){if(/^nursing-study-stats-\d{4}-\d{2}-\d{2}$/.test(key))seconds+=Math.max(0,Number(decode(value)?.seconds)||0);}
  add('累计复习用时：'+Math.floor(seconds/3600)+' 小时 '+Math.floor(seconds%3600/60)+' 分钟。');
  if(data.last)add('最近学习：'+data.last.title);
  const byDay=new Map();for(const event of objective){if(!byDay.has(event.day))byDay.set(event.day,[]);byDay.get(event.day).push(event);}
  add('每日学习','Heading1');const days=new Set(events.map(e=>e.day));for(const key of Object.keys(records)){const m=key.match(/^nursing-(?:study-stats|dashboard-day)-(\d{4}-\d{2}-\d{2})$/);if(m)days.add(m[1]);}
  if(!days.size)add('暂无每日记录。');
  for(const day of [...days].sort().reverse()){
   const es=byDay.get(day)||[],stats=decode(records['nursing-study-stats-'+day]||'{}'),daily=decode(records['nursing-dashboard-day-'+day]||'{}');
   add(day,'Heading2');add(`复习 ${Math.floor((Number(stats.seconds)||0)/60)} 分钟；客观作答 ${es.length} 次；正确率 ${es.length?Math.round(100*es.filter(e=>e.ok).length/es.length)+'%':'暂无作答'}。`);
   if(daily.mood)add('今日心情：'+daily.mood);if(daily.moodMessage)add('留给今天的话：'+daily.moodMessage);if(daily.joy)add('今日小确幸：'+daily.joy);
   if(Array.isArray(daily.tasks))for(const task of daily.tasks){if(typeof task==='string')add('任务：'+task);else if(task?.text||task?.title)add((task.done?'已完成：':'待完成：')+(task.text||task.title));}
  }
  add('我的笔记','Heading1');let notes=0;const seen=new Set();
  function note(title,body){body=printable(body);if(!body.trim())return;const id=title+'\n'+body;if(seen.has(id))return;seen.add(id);notes++;add(title||'学习笔记','Heading2');const lines=body.split(/\r?\n/);lines.forEach((line,i)=>add(line,lines.length<=8&&i<lines.length-1?'NoteLine':'Normal'));}
  function walk(value,label,key){
   if(Array.isArray(value)){for(const item of value){if(item&&typeof item==='object'&&(item.body||item.content))note(item.title||label,item.body||item.content);else if(typeof item==='string'&&/note/i.test(key))note(label,item);else if(item&&typeof item==='object')walk(item,label,key);}return;}
   if(value&&typeof value==='object'){if(value.body||value.content){note(value.title||label,value.body||value.content);return;}for(const [k,v] of Object.entries(value))if(/notes|explanation|draft/i.test(k))walk(v,label,k);return;}
   if(/notes?|explanation/i.test(key))note(label,value);
  }
  const chapterLabel=key=>{const m=key.match(/(?:fundamentals-ch|introduction-|intro-note-)(\d+)/);if(key.startsWith('nursing-medical-hf'))return '内科 心力衰竭笔记';return m?(key.includes('fundamentals')?'基础护理学':'护理学导论')+' 第 '+Number(m[1])+' 章笔记':'学习笔记';};
  for(const [key,value] of Object.entries(records))if(/^(?:fundamentals-ch|intro-note-|intro-explanation-|nursing-introduction-|nursing-medical-)/.test(key))walk(decode(value),chapterLabel(key),key);
  if(!notes)add('暂无已保存的笔记。尚未保存的输入不会出现在这里。');
  add('待复习','Heading1');const queue=Object.values(data.items||{}).filter(i=>!i.reviewDismissed&&i.due<=window.NursingLearning.day());
  if(!queue.length)add('暂无到期待复习条目。');for(const item of queue){add(item.title,'Heading2');add('复习日期：'+item.due+'；'+(item.reviewReason||(!item.lastOk?'上次答错':item.uncertain?'答对但没把握':'间隔复测')));}
  add('作答明细','Heading1');if(!events.length)add('暂无作答记录。');
  for(const event of events){add(event.title||event.id,'Heading2');add(`${event.day} · ${event.kind==='self'?'自评回忆':event.mode==='first'?'首次作答':event.mode==='delayed'?'隔日复测':'重复练习'} · ${event.ok?'已答对或自评掌握':'需复习'}${event.confidence==='unsure'?' · 把握不足':''}`);}
  return rows;
 }
 function txt(snapshot){return '\uFEFF'+report(snapshot).map(p=>p.text).join('\r\n')+'\r\n\r\n完整恢复数据\r\n请保留以下内容与标记行，以便重新导入。\r\n'+BEGIN+'\r\n'+JSON.stringify(snapshot,null,2)+'\r\n'+END+'\r\n';}
 // Stored ZIP entries keep the exporter usable offline without CDN libraries.
 function zip(entries){
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
  const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc=bytes=>{let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
  const header=(size,values)=>{const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const [at,value,width] of values)width===4?view.setUint32(at,value,true):view.setUint16(at,value,true);return bytes;};
  for(const [name,text] of entries){const filename=encoder.encode(name),bytes=encoder.encode(text),sum=crc(bytes);
   const local=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[12,33,2],[14,sum,4],[18,bytes.length,4],[22,bytes.length,4],[26,filename.length,2]]);
   parts.push(local,filename,bytes);
   central.push(header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[14,33,2],[16,sum,4],[20,bytes.length,4],[24,bytes.length,4],[28,filename.length,2],[42,offset,4]]),filename);offset+=local.length+filename.length+bytes.length;
  }
  const length=central.reduce((n,p)=>n+p.length,0);return new Blob([...parts,...central,header(22,[[0,0x06054b50,4],[8,entries.length,2],[10,entries.length,2],[12,length,4],[16,offset,4]])],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 }
 const xml=text=>String(text).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function docx(snapshot){
  const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const document=declaration+`<w:document xmlns:w="${ns}"><w:body>`+report(snapshot).map(p=>`<w:p><w:pPr><w:pStyle w:val="${p.style==='NoteLine'?'Normal':p.style}"/>${p.style==='NoteLine'?'<w:keepNext/>':''}</w:pPr><w:r><w:t xml:space="preserve">${xml(p.text)}</w:t></w:r></w:p>`).join('')+'<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>';
  const styles=declaration+`<w:styles xmlns:w="${ns}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Microsoft YaHei"/><w:color w:val="000000"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="340" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>`+[['Title','Title',36,240],['Heading1','heading 1',28,260],['Heading2','heading 2',23,160]].map(([id,name,size,before])=>`<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="${before}" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="${size}"/></w:rPr></w:style>`).join('')+'</w:styles>';
  return zip([
   ['[Content_Types].xml',declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
   ['_rels/.rels',declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
   ['word/document.xml',document],['word/styles.xml',styles],
   ['word/_rels/document.xml.rels',declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']
  ]);
 }
 window.NursingLearningExport={report,txt,docx};
})();
