(() => {
  'use strict';
  const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
  const keyDay=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
  const SETTINGS='nursing-dashboard-settings-v1';
  let day=keyDay(),daily,settings={};
  const blank=()=>({mood:'',moodMessage:'',joy:'',tasks:[{text:'复习一个章节的核心考点',done:false},{text:'完成一次互动练习',done:false},{text:'整理一条错题或易混点',done:false}]});
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  function loadDay(){daily={...blank(),...read(`nursing-dashboard-day-${day}`,{})};if(!Array.isArray(daily.tasks))daily.tasks=blank().tasks;}
  settings=read(SETTINGS,{});loadDay();
  const saveDaily=()=>write(`nursing-dashboard-day-${day}`,daily);
  function ensureDay(){if(keyDay()===day)return;day=keyDay();loadDay();renderMood();renderTasks();renderWords();renderCountdown();}
  function renderCountdown(){
    const input=$('#examDate'),out=$('#countdownValue'),sub=$('#countdownSub');if(!input)return;
    input.min=day;input.value=settings.examDate||'';
    if(!settings.examDate){out.textContent='待设置';sub.textContent='选择考试日期后开始倒计时';return;}
    const parts=settings.examDate.split('-').map(Number);
    if(parts.length!==3||!parts.every(Number.isFinite)){out.textContent='待设置';sub.textContent='请重新选择考试日期';return;}
    const now=new Date(),diff=Math.round((Date.UTC(parts[0],parts[1]-1,parts[2])-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
    out.textContent=diff>0?`${diff} 天`:diff===0?'今天':'已过期';sub.textContent=diff>=0?'保持节奏，按计划完成':'请选择今天之后的日期';
  }
  function renderStats(){
    ensureDay();const s=read(`nursing-study-stats-${day}`,{}),seconds=Math.max(0,Math.floor(Number(s.seconds||0))),minutes=Math.floor(seconds/60);
    $('#timeValue').textContent=seconds<60?`${seconds} 秒`:minutes<60?`${minutes} 分 ${seconds%60} 秒`:`${Math.floor(minutes/60)} 小时 ${minutes%60} 分`;
    const attempts=Number(s.attempts||0),correct=Number(s.correct||0);
    $('#accuracyValue').textContent=attempts?`${Math.round(correct/attempts*100)}%`:'—';$('#accuracySub').textContent=attempts?`今日 ${correct}/${attempts} 次判断正确`:'完成互动题后自动统计';
  }
  function renderMood(){document.querySelectorAll('[data-mood]').forEach(b=>{b.classList.toggle('active',b.dataset.mood===daily.mood);b.setAttribute('aria-pressed',String(b.dataset.mood===daily.mood));});$('#moodText').textContent=daily.mood?`今天是“${daily.mood}”`:'选一个最接近的状态';}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function renderTasks(){
    const box=$('#todayTasks');box.innerHTML=daily.tasks.map((t,i)=>`<label class="today-task ${t.done?'done':''}"><input type="checkbox" data-task="${i}" ${t.done?'checked':''}><span>${esc(t.text)}</span><button type="button" data-remove="${i}" aria-label="删除任务">×</button></label>`).join('');
    box.querySelectorAll('[data-task]').forEach(x=>x.onchange=()=>{ensureDay();daily.tasks[+x.dataset.task].done=x.checked;saveDaily();renderTasks();});
    box.querySelectorAll('[data-remove]').forEach(x=>x.onclick=e=>{e.preventDefault();ensureDay();daily.tasks.splice(+x.dataset.remove,1);saveDaily();renderTasks();});$('#taskProgress').textContent=`${daily.tasks.filter(x=>x.done).length}/${daily.tasks.length} 完成`;
  }
  function renderWords(){for(const [id,field]of[['moodMessage','moodMessage'],['todayJoy','joy']]){const input=$('#'+id);if(input&&document.activeElement!==input)input.value=daily[field]||'';}}
  for(const [id,field,status]of[['moodMessage','moodMessage','moodSaveStatus'],['todayJoy','joy','joySaveStatus']]){
    const input=$('#'+id);if(!input)continue;input.oninput=()=>{ensureDay();daily[field]=input.value;const ok=saveDaily();$('#'+status).textContent=ok?'已自动保存':'当前无法保存，请复制文字备份';};
  }
  $('#examDate').onchange=e=>{settings.examDate=e.target.value;write(SETTINGS,settings);renderCountdown();};
  document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{ensureDay();daily.mood=b.dataset.mood;saveDaily();renderMood();});
  $('#addTask').onclick=()=>{ensureDay();const input=$('#newTask'),text=input.value.trim();if(!text)return input.focus();daily.tasks.push({text,done:false});input.value='';saveDaily();renderTasks();};
  $('#newTask').onkeydown=e=>{if(e.key==='Enter')$('#addTask').click();};
  function refresh(){ensureDay();loadDay();renderStats();renderMood();renderTasks();renderWords();renderCountdown();}
  renderCountdown();renderStats();renderMood();renderTasks();renderWords();
  addEventListener('nursing-study-stats-update',renderStats);addEventListener('storage',e=>{if(e.key?.startsWith('nursing-dashboard-day-'))refresh();else renderStats();});
  addEventListener('focus',refresh);addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});setInterval(renderStats,1000);
})();
