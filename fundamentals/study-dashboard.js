(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const day = new Date().toLocaleDateString('sv-SE');
  const SETTINGS='nursing-dashboard-settings-v1';
  const DAILY=`nursing-dashboard-day-${day}`;
  let settings={},daily={mood:'',tasks:[]};
  try{settings=JSON.parse(localStorage.getItem(SETTINGS)||'{}')}catch(e){}
  try{daily={...daily,...JSON.parse(localStorage.getItem(DAILY)||'{}')}}catch(e){}
  if(!Array.isArray(daily.tasks)||!daily.tasks.length){
    daily.tasks=[
      {text:'复习一个章节的高频核心',done:false},
      {text:'完成一次互动练习',done:false},
      {text:'整理一条错题或易混点',done:false}
    ];
  }
  const saveSettings=()=>localStorage.setItem(SETTINGS,JSON.stringify(settings));
  const saveDaily=()=>localStorage.setItem(DAILY,JSON.stringify(daily));
  const stats=()=>{try{return JSON.parse(localStorage.getItem(`nursing-study-stats-${day}`)||'{}')}catch(e){return {}}};

  function renderCountdown(){
    const input=$('#examDate'),out=$('#countdownValue'),sub=$('#countdownSub');
    input.value=settings.examDate||'';
    if(!settings.examDate){out.textContent='—';sub.textContent='设置考试日期后自动计算';return}
    const target=new Date(settings.examDate+'T00:00:00');
    const today=new Date(day+'T00:00:00');
    const diff=Math.ceil((target-today)/86400000);
    if(diff>0){out.textContent=diff;sub.textContent='天后考试'}
    else if(diff===0){out.textContent='今天';sub.textContent='稳住节奏，按计划完成'}
    else{out.textContent='—';sub.textContent='考试日期已过，请重新设置'}
  }
  function renderStats(){
    const s=stats(),seconds=Number(s.seconds||0),minutes=Math.floor(seconds/60);
    $('#timeValue').textContent=minutes<60?`${minutes} 分钟`:`${Math.floor(minutes/60)} 小时 ${minutes%60} 分`;
    const attempts=Number(s.attempts||0),correct=Number(s.correct||0);
    $('#accuracyValue').textContent=attempts?`${Math.round(correct/attempts*100)}%`:'—';
    $('#accuracySub').textContent=attempts?`今日 ${correct}/${attempts} 次判断正确`:'完成互动题后自动统计';
  }
  function renderMood(){
    document.querySelectorAll('[data-mood]').forEach(b=>{
      b.classList.toggle('active',b.dataset.mood===daily.mood);
      b.setAttribute('aria-pressed',String(b.dataset.mood===daily.mood));
    });
    $('#moodText').textContent=daily.mood?`今天是“${daily.mood}”`:'选一个最接近的状态';
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function renderTasks(){
    const box=$('#todayTasks');
    box.innerHTML=daily.tasks.map((t,i)=>`<label class="today-task ${t.done?'done':''}"><input type="checkbox" data-task="${i}" ${t.done?'checked':''}><span>${esc(t.text)}</span><button type="button" data-remove="${i}" aria-label="删除任务">×</button></label>`).join('');
    box.querySelectorAll('[data-task]').forEach(x=>x.onchange=()=>{daily.tasks[+x.dataset.task].done=x.checked;saveDaily();renderTasks()});
    box.querySelectorAll('[data-remove]').forEach(x=>x.onclick=e=>{e.preventDefault();daily.tasks.splice(+x.dataset.remove,1);saveDaily();renderTasks()});
    const done=daily.tasks.filter(x=>x.done).length;
    $('#taskProgress').textContent=`${done}/${daily.tasks.length} 完成`;
  }
  $('#examDate').onchange=e=>{settings.examDate=e.target.value;saveSettings();renderCountdown()};
  document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{daily.mood=b.dataset.mood;saveDaily();renderMood()});
  $('#addTask').onclick=()=>{
    const input=$('#newTask'),text=input.value.trim();if(!text)return input.focus();
    daily.tasks.push({text,done:false});input.value='';saveDaily();renderTasks();
  };
  $('#newTask').onkeydown=e=>{if(e.key==='Enter')$('#addTask').click()};
  renderCountdown();renderStats();renderMood();renderTasks();
  setInterval(renderStats,15000);
})();

