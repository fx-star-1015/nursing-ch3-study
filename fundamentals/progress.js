(() => {
  const $=s=>document.querySelector(s);
  const pad=n=>String(n).padStart(2,'0');
  const keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}};
  const moodArt={"轻松":"<svg class=\"mood-art\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"17\" fill=\"#ffe59b\"/><g fill=\"none\" stroke=\"#4a3d56\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 17q2.5-3 5 0M23 17q2.5-3 5 0\"/><path d=\"M13 23q7 7 14 0\"/></g></svg>","平静":"<svg class=\"mood-art\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"17\" fill=\"#dcebf7\"/><g fill=\"none\" stroke=\"#4a3d56\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 17h3M24 17h3\"/><path d=\"M15 24q5 3 10 0\"/></g></svg>","疲惫":"<svg class=\"mood-art\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"17\" fill=\"#e8def2\"/><g fill=\"none\" stroke=\"#4a3d56\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 18q2.5 2 5 0M23 18q2.5 2 5 0\"/><path d=\"M16 26h8\"/></g></svg>","焦虑":"<svg class=\"mood-art\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"17\" fill=\"#ffd9cc\"/><g fill=\"none\" stroke=\"#4a3d56\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"15\" cy=\"17\" r=\"1.2\" fill=\"#4a3d56\" stroke=\"none\"/><circle cx=\"25\" cy=\"17\" r=\"1.2\" fill=\"#4a3d56\" stroke=\"none\"/><path d=\"M14 26q3-5 6 0t6 0\"/></g></svg>","有力量":"<svg class=\"mood-art\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"17\" fill=\"#d9c5f2\"/><path d=\"M22 8l-9 14h7l-2 10 9-15h-7z\" fill=\"#7048b7\" stroke=\"#4a3d56\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/></svg>"};
  const statsByDay={},dailyByDay={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||'';
    if(key.startsWith('nursing-study-stats-'))statsByDay[key.slice(20)]=read(key);
    if(key.startsWith('nursing-dashboard-day-'))dailyByDay[key.slice(22)]=read(key);
  }
  const allDays=[...new Set([...Object.keys(statsByDay),...Object.keys(dailyByDay)])].sort();
  const totals=allDays.reduce((a,day)=>{
    const s=statsByDay[day]||{},d=dailyByDay[day]||{};
    a.seconds+=Number(s.seconds||0);a.attempts+=Number(s.attempts||0);a.correct+=Number(s.correct||0);
    a.done+=(Array.isArray(d.tasks)?d.tasks:[]).filter(x=>x.done).length;
    if(Number(s.seconds||0)>0||Number(s.attempts||0)>0)a.studyDays++;
    return a;
  },{seconds:0,attempts:0,correct:0,done:0,studyDays:0});
  const minutes=Math.floor(totals.seconds/60);
  $('#totalDone').textContent=`${totals.done} 项`;
  $('#totalAttempts').textContent=`${totals.attempts} 次互动判断`;
  $('#totalTime').textContent=minutes<60?`${minutes} 分钟`:`${Math.floor(minutes/60)} 小时 ${minutes%60} 分`;
  $('#studyDays').textContent=`${totals.studyDays} 天`;
  const score=totals.attempts?Math.round(totals.correct/totals.attempts*100):null;
  $('#totalAccuracy').textContent=score===null?'—':`${score}%`;
  $('#scoreHint').textContent=score===null?'完成互动题后显示':`${totals.correct}/${totals.attempts} 次判断正确`;
  if(score!==null)$('#scoreCard').classList.add(score>=60?'good':'low');

  const now=new Date(),today=keyOf(now);
  $('#todayLabel').textContent=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  $('#monthLabel').textContent=`${now.getFullYear()}年 ${now.getMonth()+1}月`;
  const first=new Date(now.getFullYear(),now.getMonth(),1),last=new Date(now.getFullYear(),now.getMonth()+1,0);
  const start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));
  const end=new Date(last);end.setDate(last.getDate()+(6-((last.getDay()+6)%7)));
  const calendar=[];
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const key=keyOf(d),s=statsByDay[key]||{},mins=Math.floor(Number(s.seconds||0)/60);
    const level=mins===0?0:mins<20?1:mins<45?2:mins<90?3:4;
    calendar.push(`<article class="day heat-${level} ${d.getMonth()===now.getMonth()?'':'out'} ${key===today?'today':''}" title="${key} · ${mins}分钟"><time>${d.getDate()}</time><b>${mins?mins+' 分钟':'—'}</b><small>${Number(s.attempts||0)?Number(s.attempts||0)+' 次判断':'暂无记录'}</small></article>`);
  }
  $('#calendar').innerHTML=calendar.join('');

  const moods=Object.keys(dailyByDay).sort().reverse().filter(day=>dailyByDay[day].mood).slice(0,20);
  $('#moodWall').innerHTML=moods.length?moods.map(day=>{const mood=dailyByDay[day].mood;return `<article class="note"><span class="mood-glyph">${moodArt[mood]||''}</span><b>${mood}</b><time>${day}</time></article>`}).join(''):'<p class="empty">从首页记录今日心情后，便利贴会出现在这里。</p>';

  const scored=Object.keys(statsByDay).sort().reverse().filter(day=>Number(statsByDay[day].attempts||0)>0).slice(0,14);
  $('#accuracyList').innerHTML=scored.length?scored.map(day=>{const s=statsByDay[day],rate=Math.round(Number(s.correct||0)/Number(s.attempts||0)*100),tone=rate>=60?'good':'low';return `<div class="accuracy-row ${tone}"><time>${day.slice(5).replace('-','/')}</time><div class="track"><div class="fill" style="width:${rate}%"></div></div><b>${rate}%</b></div>`}).join(''):'<p class="empty">完成互动题后，这里会出现每天的正确率。</p>';
})();


