const KEY='positioning-demo-v2';
const correct={anesthesia:'anesthesia',shock:'shock',semi:'semi',sitting:'sitting',trend:'trend'};
let state={done:{},wrong:{},practice:{}};
try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')};state.practice=state.practice||{}}catch(e){}
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const todayStatsKey=()=>`nursing-study-stats-${new Date().toLocaleDateString('sv-SE')}`;
function recordAttempt(ok,id,title){
  if(window.NursingLearning){window.NursingLearning.record(`ch04-position-${id}`,ok,{kind:"objective",chapter:"ch04",title:title||"卧位判断",url:`positioning-demo.html#scene-${id}`});return;}
  try{
    const key=todayStatsKey(),stats=JSON.parse(localStorage.getItem(key)||'{}');
    stats.attempts=Number(stats.attempts||0)+1;
    stats.correct=Number(stats.correct||0)+(ok?1:0);
    localStorage.setItem(key,JSON.stringify(stats));
  }catch(e){}
}

function update(){
  const sceneDone=Object.keys(state.done).filter(k=>state.done[k]).length;
  const practiceDone=['order','match','memory'].filter(k=>state.practice[k]).length;
  const done=sceneDone+practiceDone;
  document.getElementById('progressText').textContent=`${done} / 8`;
  document.getElementById('progressBar').style.width=(done/8*100)+'%';
  const list=document.getElementById('reviewList');
  const ids=Object.keys(state.wrong).filter(k=>state.wrong[k]);
  list.innerHTML=ids.length?ids.map(id=>{
    const s=document.querySelector(`[data-scene="${id}"]`);
    return `<article class="review-card"><b>${s.querySelector('h2').textContent}</b><p>这里曾出现判断偏差，再看一次线索、图和依据。</p><a class="return" href="#scene-${id}">回到这个情景 ↑</a></article>`
  }).join(''):'<p class="empty">完成上面的互动后，这里会出现你的复习入口。</p>';
}

document.querySelectorAll('[data-scene]').forEach(scene=>{
  const id=scene.dataset.scene,fb=scene.querySelector('.feedback'),embed=scene.querySelector('.embedded');
  if(state.done[id])embed.classList.add('open');
  scene.querySelectorAll('.choice').forEach(btn=>btn.onclick=()=>{
    scene.querySelectorAll('.choice').forEach(x=>x.classList.remove('correct','wrong'));
    const ok=btn.dataset.pick===correct[id];
    recordAttempt(ok,id,scene.querySelector("h2")?.textContent);
    if(ok){
      btn.classList.add('correct');fb.className='feedback ok';
      fb.textContent='判断正确。现在用同一考点的题目马上验证。';
      embed.classList.add('open');state.done[id]=true;
    }else{
      btn.classList.add('wrong');fb.className='feedback no';
      fb.textContent='先别背答案：重新对照病人线索、身体方向和图中的角度。';
      state.wrong[id]=true;
    }
    save();update();
  });
  scene.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{
    scene.querySelectorAll('.option').forEach(x=>x.classList.remove('correct','wrong'));
    const ok=btn.dataset.answer==='0';btn.classList.add(ok?'correct':'wrong');
    recordAttempt(ok,id,scene.querySelector("h2")?.textContent);
    if(!ok)state.wrong[id]=true;else state.done[id]=true;
    embed.querySelector('.explain').classList.add('show');save();update();
  });
});

const orderList=document.getElementById('orderList');
orderList.addEventListener('click',e=>{
  const b=e.target.closest('[data-move]');if(!b)return;
  const row=b.closest('.order-row');
  if(b.dataset.move==='up'&&row.previousElementSibling)orderList.insertBefore(row,row.previousElementSibling);
  if(b.dataset.move==='down'&&row.nextElementSibling)orderList.insertBefore(row.nextElementSibling,row);
});
document.getElementById('checkOrder').onclick=()=>{
  const values=[...orderList.children].map(x=>x.dataset.step).join('');
  const fb=document.getElementById('orderFeedback');
  if(window.NursingLearning)window.NursingLearning.record('ch04-position-order',values==='1234',{kind:'objective',chapter:'ch04',title:'卧位判断顺序',url:'positioning-demo.html#practice'});
  if(values==='1234'){
    fb.className='practice-feedback ok';fb.textContent='顺序正确：先抓病情，再定目标，随后排禁忌，最后核对安全。';
    state.practice.order=true;
  }else{fb.className='practice-feedback no';fb.textContent='还差一点。想想临床判断为什么不能从“摆好以后”开始。'}
  save();update();
};

let activeClue=null;const matched=new Set();
document.querySelectorAll('.match-clue').forEach(btn=>btn.onclick=()=>{
  if(btn.classList.contains('matched'))return;
  document.querySelectorAll('.match-clue').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');activeClue=btn;
});
document.querySelectorAll('.match-target').forEach(btn=>btn.onclick=()=>{
  if(!activeClue||btn.classList.contains('matched'))return;
  const fb=document.getElementById('matchFeedback');
  if(window.NursingLearning)window.NursingLearning.record(`ch04-position-match-${activeClue.dataset.match}`,activeClue.dataset.match===btn.dataset.match,{kind:'objective',chapter:'ch04',title:activeClue.textContent,url:'positioning-demo.html#practice'});
  if(activeClue.dataset.match===btn.dataset.match){
    activeClue.classList.add('matched');btn.classList.add('matched');
    matched.add(btn.dataset.match);activeClue=null;
    fb.className='practice-feedback ok';fb.textContent=`已连对 ${matched.size}/4 组。`;
    if(matched.size===4){state.practice.match=true;fb.textContent='全部连对。你已经把病情线索连接到了体位。'}
  }else{
    btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);
    fb.className='practice-feedback no';fb.textContent='这组不匹配。回想最急的护理目的。';
  }
  save();update();
});
document.getElementById('resetMatch').onclick=()=>{
  matched.clear();activeClue=null;
  document.querySelectorAll('.match-btn').forEach(x=>x.classList.remove('matched','selected','wrong'));
  document.getElementById('matchFeedback').textContent='先点左侧情景，再点右侧体位。';
};

const pairs=[
  {id:'a',a:'全麻未醒',b:'去枕仰卧'},
  {id:'b',a:'休克',b:'中凹卧位'},
  {id:'c',a:'急性肺水肿',b:'端坐位'},
  {id:'d',a:'腹部术后',b:'半坐卧位'}
];
let firstCard=null,lock=false,memoryMatched=0;
function renderMemory(){
  const cards=pairs.flatMap(p=>[{id:p.id,text:p.a},{id:p.id,text:p.b}]).sort(()=>Math.random()-.5);
  const box=document.getElementById('memoryGrid');
  box.innerHTML=cards.map((c,i)=>`<button class="memory-card" data-pair="${c.id}" data-index="${i}"><span class="back">?</span><span class="front">${c.text}</span></button>`).join('');
  firstCard=null;lock=false;memoryMatched=0;
  box.querySelectorAll('.memory-card').forEach(card=>card.onclick=()=>flipCard(card));
  document.getElementById('memoryFeedback').textContent='每次翻两张，把病情与体位配成一对。';
}
function flipCard(card){
  if(lock||card.classList.contains('open')||card.classList.contains('matched'))return;
  card.classList.add('open');
  if(!firstCard){firstCard=card;return}
  if(firstCard.dataset.pair===card.dataset.pair){
    firstCard.classList.add('matched');card.classList.add('matched');memoryMatched++;
    firstCard=null;document.getElementById('memoryFeedback').textContent=`已找到 ${memoryMatched}/4 对。`;
    if(memoryMatched===4){state.practice.memory=true;save();update();document.getElementById('memoryFeedback').textContent='全部配对完成。再来一轮会重新洗牌。'}
  }else{
    lock=true;const old=firstCard;firstCard=null;
    setTimeout(()=>{old.classList.remove('open');card.classList.remove('open');lock=false},650);
  }
}
document.getElementById('resetMemory').onclick=renderMemory;renderMemory();

document.getElementById('reset').onclick=()=>{
  if(confirm('清除这个 DEMO 的学习记录？')){localStorage.removeItem(KEY);location.reload()}
};
update();


