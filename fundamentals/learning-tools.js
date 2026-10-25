(() => {
 'use strict';
 if(window.NursingLearningTools)return;
 const L=window.NursingLearning,base=new URL('.',document.currentScript.src),KEY='nursing-learning-v1';
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('learning-tools.css?v=20261026a',base);document.head.append(style);
 const allowed=k=>/^(?:nursing-|fundamentals-|intro-note-|intro-explanation-|positioning-demo-|admission-demo-|graded-care-demo-|transfer-demo-)/.test(k)&&k!=='nursing-study-timer-owner-v2';
 const cleanKey=k=>!['__proto__','prototype','constructor'].includes(k);
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const parse=text=>{try{return JSON.parse(String(text).replace(/^\uFEFF/,''));}catch(_){throw Error('内容不是有效的 JSON。请选择本网页导出的 .json 文件，或粘贴完整记录；普通笔记文档不能导入这里。');}};
 function exportData(){
  const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowed(k)&&k!==KEY)records[k]=localStorage.getItem(k);}
  return JSON.stringify({format:'ice-nursing-study-backup',version:2,exportedAt:new Date().toISOString(),learning:JSON.parse(L.exportData()),records},null,2);
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
  else throw Error('文件格式不匹配。支持本网页导出的新版 .json 和旧版学习记录 .json；不支持 Word、图片或章节笔记文本。');
  if(!object(learning.items)||Object.keys(learning.items).some(k=>!cleanKey(k)))throw Error('学习条目格式不正确。');
  const plan=[];
  for(const [key,value] of Object.entries(records)){
   if(!allowed(key)||key===KEY||typeof value!=='string')throw Error('备份中包含不支持的记录字段。');
   const current=localStorage.getItem(key);let merged=value;
   if(current!==null){try{merged=JSON.stringify(mergeValue(JSON.parse(current),JSON.parse(value),key));}catch(err){if(err.message==='记录中含有不支持的字段。')throw err;merged=mergeValue(current,value,key);}}
   plan.push([key,merged]);
  }
  const last=learning.last,safeLast=last&&typeof last.title==='string'&&Number.isFinite(Date.parse(last.at))&&typeof last.url==='string'&&/^(?:(?:\.\.\/)?introduction\/)?(?:ch\d\d(?:-[a-z-]+)?|intro\d\d-learning-lab|positioning-demo|admission-demo|graded-care-demo|transfer-demo)\.html(?:#[\w-]+)?$/.test(last.url);
  const before=new Map(plan.map(([key])=>[key,localStorage.getItem(key)]));before.set(KEY,localStorage.getItem(KEY)||L.exportData());
  try{L.importData(JSON.stringify(learning));if(safeLast){const merged=JSON.parse(L.exportData());if(!merged.last||last.at>merged.last.at){merged.last=last;localStorage.setItem(KEY,JSON.stringify(merged));}}for(const [key,value] of plan)localStorage.setItem(key,value);}
  catch(err){for(const [key,value] of before){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch(_){}}throw err;}
  window.dispatchEvent(new CustomEvent('nursing-learning-update'));window.dispatchEvent(new CustomEvent('nursing-study-stats-update'));window.dispatchEvent(new Event('focus'));
  return {events:learning.events.length,records:plan.length};
 }
 let dialog;
 function makeDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='learningBackupDialog';dialog.className='learning-backup-dialog';dialog.setAttribute('aria-labelledby','learningBackupTitle');
  dialog.innerHTML='<div class="backup-dialog-head"><h2 id="learningBackupTitle"></h2><button type="button" id="closeLearningBackup" aria-label="关闭记录备份">×</button></div><p id="learningBackupHelp"></p><label id="learningBackupFileLabel">选择本网页导出的 .json 文件<input id="learningBackupFile" type="file" accept=".json,application/json"></label><label id="learningBackupTextLabel" for="learningBackupText"></label><textarea id="learningBackupText" spellcheck="false" aria-describedby="learningBackupHelp"></textarea><div class="backup-dialog-actions"><button type="button" id="copyLearningBackup">复制完整记录</button><button type="button" id="downloadLearningBackup">下载 .json 文件</button><button type="button" id="applyLearningBackup">合并导入</button></div><p id="learningBackupStatus" role="status" aria-live="polite"></p>';
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id),status=message=>{$('learningBackupStatus').textContent=message;};
  $('closeLearningBackup').onclick=()=>{if(dialog.close)dialog.close();else dialog.removeAttribute('open');};
  $('copyLearningBackup').onclick=async()=>{try{await navigator.clipboard.writeText($('learningBackupText').value);status('已复制完整记录，可粘贴到另一台设备导入。');}catch(_){$('learningBackupText').focus();$('learningBackupText').select();try{if(!document.execCommand('copy'))throw Error();status('已复制完整记录。');}catch(_){status('已选中全部记录。请长按文本选择“复制”，再到另一台设备粘贴导入。');}}};
  $('downloadLearningBackup').onclick=()=>{
   const a=document.createElement('a'),url=URL.createObjectURL(new Blob([$('learningBackupText').value],{type:'application/json;charset=utf-8'}));a.href=url;a.download=`护理学习记录-${L.day()}.json`;a.hidden=true;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},30000);status('已请求浏览器保存 .json 文件。若未出现下载，请使用“复制完整记录”，在目标设备粘贴导入。');
  };
  $('learningBackupFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{$('learningBackupText').value=await file.text();status('已读取“'+file.name+'”，点击“合并导入”完成恢复。');}catch(_){status('没有读取到文件。可改用粘贴完整记录。');}e.target.value='';};
  $('applyLearningBackup').onclick=()=>{try{const text=$('learningBackupText').value.trim();if(!text)throw Error('请先选择 .json 文件，或粘贴完整记录。');const result=importData(text);status(`已合并导入 ${result.events} 条作答记录${result.records?'及笔记、计时等备份数据':''}，已有记录已保留。`);}catch(err){status(err.message||'导入未完成，请重新选择记录文件。');}};
  return dialog;
 }
 function openBackup(mode){
  const d=makeDialog(),$=id=>d.querySelector('#'+id),exporting=mode==='export';
  $('learningBackupTitle').textContent=exporting?'导出学习记录':'导入学习记录';
  $('learningBackupHelp').textContent=exporting?'包含答题、待复习、笔记、计时、任务与心情。可以保存 .json 文件，也可以复制完整记录。':'支持本网页导出的 .json 文件（兼容旧版）。选择文件或粘贴完整记录后，点击“合并导入”。重复导入不会重复累计作答。';
  $('learningBackupFileLabel').hidden=exporting;$('learningBackupTextLabel').textContent=exporting?'完整记录（可长按复制）':'或在这里粘贴完整记录';$('learningBackupText').readOnly=exporting;$('learningBackupText').value=exporting?exportData():'';
  $('copyLearningBackup').hidden=!exporting;$('downloadLearningBackup').hidden=!exporting;$('applyLearningBackup').hidden=exporting;$('learningBackupStatus').textContent='';
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
