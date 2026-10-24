(() => {
  const page=document.body.dataset.lab||location.pathname;
  const key=`ch04-lab-${page}`;
  let state={done:{}};try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch(e){}
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const dayKey=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `nursing-study-stats-${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
  function record(ok,id,title){if(window.NursingLearning){window.NursingLearning.record(`ch04-${page}-${id}`,ok,{kind:"objective",chapter:"ch04",title:title||"情境判断",url:`${location.pathname.split("/").pop()}#activity-${id}`});return;}try{const k=dayKey(),s=JSON.parse(localStorage.getItem(k)||'{}');s.attempts=Number(s.attempts||0)+1;s.correct=Number(s.correct||0)+(ok?1:0);localStorage.setItem(k,JSON.stringify(s))}catch(e){}}
  function update(){const total=document.querySelectorAll('[data-activity]').length,done=Object.values(state.done).filter(Boolean).length;document.getElementById('progressText').textContent=`${done}/${total} 完成`;document.getElementById('progressBar').style.width=`${total?done/total*100:0}%`}
  document.querySelectorAll('.quiz-card[data-answer]').forEach((card,i)=>{
    const id=card.dataset.id||`q${i}`,fb=card.querySelector('.feedback');card.id=`activity-${id}`;
    card.querySelectorAll('.choices button').forEach(btn=>btn.onclick=()=>{
      card.querySelectorAll('.choices button').forEach(x=>x.classList.remove('correct','wrong'));
      const ok=btn.dataset.value===card.dataset.answer;btn.classList.add(ok?'correct':'wrong');record(ok,id,card.querySelector('h3')?.textContent);
      fb.className=`feedback ${ok?'ok':'no'}`;fb.textContent=ok?card.dataset.ok:card.dataset.no;
      if(ok){state.done[id]=true;save();update()}
    });
  });
  document.querySelectorAll('.match-board').forEach((board,bi)=>{
    let active=null,matched=new Set();const fb=board.parentElement.querySelector('.practice-feedback'),id=board.dataset.id||`m${bi}`;
    board.closest('[data-activity]').id=`activity-${id}`;
    board.querySelectorAll('.match-left').forEach(btn=>btn.onclick=()=>{if(btn.classList.contains('matched'))return;board.querySelectorAll('.match-left').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');active=btn});
    board.querySelectorAll('.match-right').forEach(btn=>btn.onclick=()=>{if(!active||btn.classList.contains('matched'))return;const ok=active.dataset.match===btn.dataset.match;record(ok,id,active.textContent);if(ok){active.classList.add('matched');active.classList.remove('selected');btn.classList.add('matched');matched.add(btn.dataset.match);active=null;fb.className='practice-feedback feedback ok';fb.textContent=`已连对 ${matched.size}/${board.querySelectorAll('.match-left').length} 组。`;if(matched.size===board.querySelectorAll('.match-left').length){state.done[id]=true;save();update()}}else{btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);fb.className='practice-feedback feedback no';fb.textContent='这组不匹配，再看病情、能力或安全条件。'}});
  });
  document.querySelectorAll('.sort-board').forEach((board,si)=>{
    board.addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(!b)return;const row=b.closest('.sort-row');if(b.dataset.move==='up'&&row.previousElementSibling)board.insertBefore(row,row.previousElementSibling);if(b.dataset.move==='down'&&row.nextElementSibling)board.insertBefore(row.nextElementSibling,row);[...board.children].forEach((item,index)=>item.firstElementChild.textContent=String(index+1))});
    const section=board.closest('[data-activity]'),btn=section.querySelector('.check-btn'),fb=section.querySelector('.practice-feedback'),id=board.dataset.id||`s${si}`;
    section.id=`activity-${id}`;
    btn.onclick=()=>{const actual=[...board.children].map(x=>x.dataset.order).join(''),ok=actual===board.dataset.answer;record(ok,id,'操作顺序');fb.className=`practice-feedback feedback ${ok?'ok':'no'}`;fb.textContent=ok?board.dataset.ok:board.dataset.no;if(ok){state.done[id]=true;save();update()}};
  });
  update();
})();



