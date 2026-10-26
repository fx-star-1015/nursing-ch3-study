(() => {
 'use strict';
 if(window.NursingLearningTools)return;
 const L=window.NursingLearning,base=new URL('.',document.currentScript.src),KEY='nursing-learning-v1';
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('learning-tools.css?v=20261026c',base);document.head.append(style);
 const MAX_BYTES=50*1024*1024,MAX_EVENTS=200000,BEGIN='===== ICE_NURSING_BACKUP_JSON_BEGIN =====',END='===== ICE_NURSING_BACKUP_JSON_END =====';
 const checkSize=text=>{if(new Blob([text]).size>MAX_BYTES)throw Error('文件或粘贴内容超过 50 MiB（52,428,800 字节）上限，未导入。');};
 const allowed=k=>/^(?:nursing-|fundamentals-|intro-note-|intro-explanation-|positioning-demo-|admission-demo-|graded-care-demo-|transfer-demo-)/.test(k)&&k!=='nursing-study-timer-owner-v2';
 const cleanKey=k=>!['__proto__','prototype','constructor'].includes(k);
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const parse=text=>{text=String(text);checkSize(text);const begin=text.indexOf(BEGIN);if(begin>=0){const end=text.indexOf(END,begin+BEGIN.length);if(end<0)throw Error('TXT 恢复数据不完整，缺少结束标记。请使用未删改的完整导出文件。');text=text.slice(begin+BEGIN.length,end).trim();}try{return JSON.parse(text.replace(/^\uFEFF/,''));}catch(_){throw Error('内容不是有效的 JSON。请选择本网页导出的 JSON 或完整 TXT 备份；普通笔记 TXT 和 Word 不能恢复学习记录。');}};
 function exportData(){
  const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowed(k)&&k!==KEY)records[k]=localStorage.getItem(k);}
  const learning=JSON.parse(L.exportData());if(learning.events.length>MAX_EVENTS)throw Error('作答记录超过 200,000 条，暂不能生成可恢复备份；请联系维护者扩容。');
  const text=JSON.stringify({format:'ice-nursing-study-backup',version:2,exportedAt:new Date().toISOString(),learning,records},null,2);checkSize(text);return text;
 }
 function mergeValue(a,b,key=''){
  if(a===undefined||a===null||a==='')return b;
  if(Array.isArray(a)&&Array.isArray(b)){
   const map=new Map();for(const x of [...a,...b]){const id=object(x)?x.id||x.text||JSON.stringify(x):JSON.stringify(x);map.set(id,map.has(id)?mergeValue(map.get(id),x,key):x);}return [...map.values()];
  }
  if(object(a)&&object(b)){const out={...a};for(const k of Object.keys(b)){if(!cleanKey(k))throw Error('记录中含有不支持的字段。');out[k]=mergeValue(a[k],b[k],k);}return out;}
  if(typeof a==='number'&&typeof b==='number')return Math.max(a,b);
  if(typeof a==='boolean'&&typeof b==='boolean')return a||b;
  if(typeof a==='string'&&typeof b==='string'&&/notes|draft|explanation|joy|moodMessage|body|content|reason/i.test(key))return a.includes(b)?a:b.includes(a)?b:a+'\n\n'+b;
  if(key==='lastAt'&&typeof a==='string'&&typeof b==='string')return a>b?a:b;
  return a;
 }
 function importData(text){
  const incoming=parse(text);if(!object(incoming))throw Error('请选择本网页导出的学习记录文件。');
  let learning,records={};
  if(incoming.version===1&&object(incoming.items)&&Array.isArray(incoming.events))learning=incoming;
  else if(incoming.format==='ice-nursing-study-backup'&&incoming.version===2&&object(incoming.learning)&&object(incoming.records)){learning=incoming.learning;records=incoming.records;}
  else throw Error('文件格式不匹配。支持本网页导出的 JSON（兼容旧版）与完整 TXT 备份；Word、图片和普通笔记文本不能恢复记录。');
  if(!Array.isArray(learning.events)||learning.events.length>MAX_EVENTS)throw Error('每份备份最多支持 200,000 条作答记录，未导入。');
  if(!object(learning.items)||Object.keys(learning.items).some(k=>!cleanKey(k)))throw Error('学习条目格式不正确。');
  const plan=[];
  for(const [key,value] of Object.entries(records)){
   if(!allowed(key)||key===KEY||typeof value!=='string')throw Error('备份中包含不支持的记录字段。');
   const current=localStorage.getItem(key);let merged=value;
   if(current!==null){try{merged=JSON.stringify(mergeValue(JSON.parse(current),JSON.parse(value),key));}catch(err){if(err.message==='记录中含有不支持的字段。')throw err;merged=mergeValue(current,value,key);}}
   plan.push([key,merged]);
  }
  const last=learning.last,safeLast=last&&typeof last.title==='string'&&Number.isFinite(Date.parse(last.at))&&L.safeUrl(last.url);
  const before=new Map(plan.map(([key])=>[key,localStorage.getItem(key)]));before.set(KEY,localStorage.getItem(KEY)||L.exportData());
  try{L.importData(JSON.stringify(learning));if(safeLast){const merged=JSON.parse(L.exportData());if(!merged.last||last.at>merged.last.at){merged.last=last;localStorage.setItem(KEY,JSON.stringify(merged));}}for(const [key,value] of plan)localStorage.setItem(key,value);}
  catch(err){for(const [key,value] of before){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch(_){}}throw err;}
  window.dispatchEvent(new CustomEvent('nursing-learning-update'));window.dispatchEvent(new CustomEvent('nursing-study-stats-update'));window.dispatchEvent(new Event('focus'));
  return {events:learning.events.length,records:plan.length};
 }
 let dialog,reportsPromise;
 function getReports(){if(window.NursingLearningExport)return Promise.resolve(window.NursingLearningExport);if(!reportsPromise)reportsPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('learning-export.js?v=20261026d',base);script.onload=()=>resolve(window.NursingLearningExport);script.onerror=()=>{reportsPromise=null;reject(Error('文档工具未能加载，请重试。'));};document.body.append(script);});return reportsPromise;}
 function saveFile(blob,extension){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`护理学习记录-${L.day()}.${extension}`;a.hidden=true;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},30000);}
 function makeDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='learningBackupDialog';dialog.className='learning-backup-dialog';dialog.setAttribute('aria-labelledby','learningBackupTitle');
  dialog.innerHTML='<div class="backup-dialog-head"><h2 id="learningBackupTitle"></h2><button type="button" id="closeLearningBackup" aria-label="关闭记录备份">×</button></div><p id="learningBackupHelp"></p><div class="backup-format-guide"><table><caption>文件格式与用途</caption><thead><tr><th>格式</th><th>用途</th><th>可导入</th></tr></thead><tbody><tr><td>JSON</td><td>完整备份、换设备恢复</td><td>可以，兼容旧版</td></tr><tr><td>TXT</td><td>阅读＋完整备份</td><td>仅本网页导出的完整文件</td></tr><tr><td>Word .docx</td><td>阅读、编辑、打印</td><td>不支持恢复</td></tr></tbody></table><p><strong>导入上限：</strong>每个文件 50 MiB（52,428,800 字节），每份最多 200,000 条作答记录；粘贴导入同样适用。JSON / TXT 使用 UTF-8 编码，TXT 末尾恢复数据请保留完整。</p><p>文件大小合规仍需浏览器有足够本地存储空间；空间不足会提示并撤销此次导入。图片、PDF、普通 TXT 笔记和 Word 不属于记录备份。</p></div><label id="learningBackupFileLabel">选择本网页导出的 JSON / TXT 备份<input id="learningBackupFile" type="file" accept=".json,.txt,application/json,text/plain"></label><label id="learningBackupTextLabel" for="learningBackupText"></label><textarea id="learningBackupText" spellcheck="false" aria-describedby="learningBackupHelp"></textarea><div class="backup-dialog-actions"><button type="button" id="copyLearningBackup">复制完整记录</button><button type="button" id="downloadLearningBackup">下载 JSON 备份</button><button type="button" id="downloadLearningTxt">导出 TXT</button><button type="button" id="downloadLearningWord">导出 Word</button><button type="button" id="applyLearningBackup">合并导入</button></div><p id="learningBackupStatus" role="status" aria-live="polite"></p>';
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id),status=message=>{$('learningBackupStatus').textContent=message;};
  $('closeLearningBackup').onclick=()=>{if(dialog.close)dialog.close();else dialog.removeAttribute('open');};
  $('copyLearningBackup').onclick=async()=>{try{await navigator.clipboard.writeText($('learningBackupText').value);status('已复制完整记录，可粘贴到另一台设备导入。');}catch(_){$('learningBackupText').focus();$('learningBackupText').select();try{if(!document.execCommand('copy'))throw Error();status('已复制完整记录。');}catch(_){status('已选中全部记录。请长按文本选择“复制”，再到另一台设备粘贴导入。');}}};
  $('downloadLearningBackup').onclick=()=>{
   saveFile(new Blob([$('learningBackupText').value],{type:'application/json;charset=utf-8'}),'json');status('已请求浏览器保存 JSON 备份。若未出现下载，请使用“复制完整记录”，在目标设备粘贴导入。');
  };
  for(const [id,extension] of [['downloadLearningTxt','txt'],['downloadLearningWord','docx']])$(id).onclick=async()=>{const button=$(id);button.disabled=true;status('正在生成文档……');try{const reports=await getReports(),snapshot=parse($('learningBackupText').value),blob=extension==='txt'?new Blob([reports.txt(snapshot)],{type:'text/plain;charset=utf-8'}):reports.docx(snapshot);if(extension==='txt'&&blob.size>MAX_BYTES)throw Error('TXT 包含阅读正文与恢复数据，已超过 50 MiB，请改用 JSON 备份。');saveFile(blob,extension);status(extension==='txt'?'已请求保存 TXT。可阅读；重新导入时请保留末尾的完整恢复数据。':'已请求保存 Word（.docx），供阅读、编辑和打印。恢复学习记录请使用 JSON 或完整 TXT。');}catch(err){status(err.message||'文档生成失败，请重试。');}finally{button.disabled=false;}};
  $('learningBackupFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;$('learningBackupText').value='';try{if(!/\.(json|txt)$/i.test(file.name))throw Error('请选择 JSON 或 TXT 备份。Word、图片和 PDF 不能导入。');if(file.size>MAX_BYTES)throw Error('文件超过 50 MiB（52,428,800 字节）上限，未读取。');const text=await file.text();parse(text);$('learningBackupText').value=text;status('已读取“'+file.name+'”，点击“合并导入”完成恢复。');}catch(err){status(err.message||'没有读取到文件。可改用粘贴完整记录。');}e.target.value='';};
  $('applyLearningBackup').onclick=()=>{try{const text=$('learningBackupText').value;if(!text.trim())throw Error('请先选择 JSON / TXT 备份，或粘贴完整记录。');const result=importData(text);status(`已合并导入 ${result.events} 条作答记录${result.records?'及笔记、计时等备份数据':''}，已有记录已保留。`);}catch(err){status(err.message||'导入未完成，请重新选择记录文件。');}};
  return dialog;
 }
 function openBackup(mode){
  const d=makeDialog(),$=id=>d.querySelector('#'+id),exporting=mode==='export';
  $('learningBackupTitle').textContent=exporting?'导出学习记录':'导入学习记录';
  $('learningBackupHelp').textContent=exporting?'备份包含答题、待复习、笔记、计时、任务与心情。选 JSON / TXT 可恢复记录；Word 用于阅读和打印。':'选择本网页导出的 JSON / 完整 TXT 文件，或粘贴完整记录，再点击“合并导入”。重复导入不会重复累计作答。';
  $('learningBackupFileLabel').hidden=exporting;$('learningBackupTextLabel').textContent=exporting?'完整记录（可长按复制）':'或在这里粘贴完整记录';$('learningBackupText').readOnly=exporting;$('learningBackupText').value=exporting?exportData():'';
  $('copyLearningBackup').hidden=!exporting;$('downloadLearningBackup').hidden=!exporting;$('downloadLearningTxt').hidden=!exporting;$('downloadLearningWord').hidden=!exporting;$('applyLearningBackup').hidden=exporting;$('learningBackupStatus').textContent='';
  if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}
 }
 const media=matchMedia('(max-width:700px)');
 let dailyDrawer,reviewDrawer,dateLabel,moodCard,bottomGrid,moodParent,dateParent;
 function compact(){
  const daily=document.querySelector('.daily-dashboard'),dashboard=document.querySelector('#learning-dashboard');
  if(daily){
   const bubble=document.querySelector('.study-pet-bubble');if(media.matches&&bubble&&!bubble.dataset.compactInitial){bubble.hidden=true;bubble.dataset.compactInitial='true';}
   if(media.matches&&!dailyDrawer){
    const metric=daily.querySelector('.metric-grid');dateLabel=daily.querySelector('.countdown-card label');moodCard=daily.querySelector('.mood-card');bottomGrid=daily.querySelector('.daily-bottom-grid');dateParent=dateLabel?.parentElement;moodParent=moodCard?.parentElement;
    dailyDrawer=document.createElement('details');dailyDrawer.className='daily-tools-drawer';dailyDrawer.innerHTML='<summary><span>今日小工具</span><small>心情 · 任务 · 小确幸 · 日期设置</small></summary><div class="daily-tools-body"></div>';metric.after(dailyDrawer);
    const content=dailyDrawer.querySelector('.daily-tools-body');if(dateLabel){const settings=document.createElement('div');settings.className='compact-date-settings';settings.append(dateLabel);content.append(settings);}if(moodCard)content.append(moodCard);if(bottomGrid)content.append(bottomGrid);
   }else if(!media.matches&&dailyDrawer){if(dateLabel&&dateParent)dateParent.append(dateLabel);if(moodCard&&moodParent)moodParent.append(moodCard);if(bottomGrid)dailyDrawer.after(bottomGrid);dailyDrawer.remove();dailyDrawer=null;}
  }
  if(dashboard&&daily&&media.matches&&!dashboard.querySelector('.learn-home-records')){
   reviewDrawer=document.createElement('details');reviewDrawer.className='learn-home-records';reviewDrawer.innerHTML='<summary>作答与待复习 <span class="compact-review-count"></span></summary><div class="learn-home-records-body"></div>';
   reviewDrawer.open=dashboard.dataset.mobileReviewOpen==='true';reviewDrawer.ontoggle=()=>{dashboard.dataset.mobileReviewOpen=String(reviewDrawer.open);};
   const nodes=[...dashboard.children].filter(n=>!n.matches('.section-head,.learn-resume'));dashboard.append(reviewDrawer);nodes.forEach(n=>reviewDrawer.lastElementChild.append(n));
  }else if(dashboard&&(!media.matches||!daily)){
   const drawer=dashboard.querySelector('.learn-home-records');if(drawer){[...drawer.lastElementChild.children].forEach(n=>dashboard.append(n));drawer.remove();}
  }
  const count=document.querySelector('.compact-review-count');if(count)count.textContent='· '+L.queue().length+' 项';
  if(location.hash==='#review-queue'){const drawer=document.querySelector('.learn-home-records');if(drawer)drawer.open=true;}
 }
 window.NursingLearningTools={openBackup,exportData,importData,compact};
 compact();media.addEventListener('change',compact);addEventListener('nursing-dashboard-rendered',compact);addEventListener('hashchange',compact);
})();
