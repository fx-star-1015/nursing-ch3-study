(() => {
 'use strict';
 const data=window.NursingIntroData;if(!data)return;
 const petBubble=document.querySelector('.study-pet-bubble');if(petBubble)petBubble.hidden=true;
 const c=data.find(x=>x.id===document.body.dataset.introChapter),L=window.NursingLearning;
 const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const get=k=>{try{return localStorage.getItem(k)||'';}catch(_){return '';}};
 const set=(k,v)=>{try{localStorage.setItem(k,v);return true;}catch(_){return false;}};
 const search=$('#introSearch');if(search)search.oninput=()=>{const q=search.value.trim().toLowerCase();all('.intro-chapter').forEach((card,i)=>card.hidden=q&&!`${data[i].title} ${data[i].summary} ${data[i].cards.map(x=>x.title).join(' ')}`.toLowerCase().includes(q));};
 if(!c)return;
 const base='../introduction/',onLab=document.body.hasAttribute('data-learning-lab');
 if(L)L.visit(c.id,c.title,base+(onLab?c.lab:c.page));
 all('[data-font]').forEach(b=>b.onclick=()=>{const n=Math.max(16,Math.min(23,Number(get('nursing-learning-font')||17)+Number(b.dataset.font)));set('nursing-learning-font',String(n));document.documentElement.style.setProperty('--learn-font',n+'px');});
 const draftKey=`intro-note-draft-${c.id}`,originKey=`intro-note-origin-${c.id}`;
 const saveDraft=(q,reason,origin)=>{const text=`题目：${q.title}\n正确答案：${q.answer}\n我的理由：${reason}\n来源：${q.paper}${q.sourcePage?' · PDF第'+q.sourcePage+'页':''}\n${q.source}`;set(draftKey,text);set(originKey,origin);location.href=c.page+'#notes';};
 function question(q,host,origin){
  const objective=q.options.length&&q.correct.length;
  host.innerHTML=`<div class="intro-question-meta"><span class="learn-badge">${q.verified?'历年试题改编':'考点练习'}</span><span>${esc(q.paper)}${q.sourcePage?' · PDF第'+q.sourcePage+'页':''}</span></div><h3>${esc(q.title)}</h3>${objective?`<div class="intro-options" role="group" aria-label="${q.correct.length>1?'选择所有正确选项':'选择一个答案'}">${q.options.map((o,i)=>`<label><input type="${q.correct.length>1?'checkbox':'radio'}" name="${q.id}" value="${o.match(/^[A-E]/)?.[0]||i}"><span>${esc(o)}</span></label>`).join('')}</div>`:'<label class="learn-muted">先写出要点，再核对<textarea class="intro-subjective" aria-label="写出你的回答"></textarea></label>'}<div class="learn-buttons">${objective?'<button class="intro-submit" type="button">提交判断</button>':''}<button class="intro-learn" type="button">${objective?'不会，先学习':'核对要点'}</button><button class="intro-retry" type="button" hidden>重新作答</button></div><p class="intro-result" role="status"></p><div class="intro-answer" hidden><p><b>参考答案：</b>${esc(q.answer)}</p><p><b>判断依据：</b>${esc(q.why)}</p><p class="learn-source">${esc(q.source)} · <a href="${c.page}#memory">回本章重点</a></p>${!objective?'<div class="learn-buttons"><button type="button" data-self-result="yes">能解释清楚</button><button type="button" data-self-result="no">需要再学</button><span class="learn-muted">自评不计入客观正确率</span></div>':''}<label>用一句话写下决定性线索<textarea class="intro-reason" placeholder="题干中的……，所以……"></textarea></label><button class="intro-save-note" type="button">保存到本章笔记</button></div>`;
  let submitted=false,assisted=false;
  const options={kind:'objective',chapter:c.id,title:q.title,url:base+origin};
  const reveal=()=>{$('.intro-answer',host).hidden=false;$('.intro-retry',host).hidden=false;assisted=true;};
  const submit=$('.intro-submit',host);
  if(submit)submit.onclick=()=>{
   if(submitted)return;const selected=all('.intro-options input:checked',host).map(x=>x.value).sort();if(!selected.length){$('.intro-result',host).textContent='先选择答案，再提交判断。';return;}
   const ok=JSON.stringify(selected)===JSON.stringify([...q.correct].sort());L?.record(q.id,ok,{...options,assisted});submitted=true;submit.disabled=true;all('.intro-options input',host).forEach(x=>x.disabled=true);
   $('.intro-result',host).textContent=ok?'回答正确。核对你抓住的条件。':'再想一想：核对对象、阶段、否定词与选项成立条件。';$('.intro-result',host).className='intro-result '+(ok?'good':'bad');reveal();
  };
  $('.intro-learn',host).onclick=()=>{reveal();if(objective){L?.review(q.id,options);$('.intro-result',host).textContent='已展开要点并加入待复习，不计为答错。';}};
  $('.intro-retry',host).onclick=()=>{submitted=false;if(submit)submit.disabled=false;all('.intro-options input',host).forEach(x=>{x.disabled=false;x.checked=false;});$('.intro-answer',host).hidden=true;$('.intro-result',host).textContent='';$('.intro-retry',host).hidden=true;};
  all('[data-self-result]',host).forEach(b=>b.onclick=()=>{L?.record(q.id,b.dataset.selfResult==='yes',{...options,kind:'self'});all('[data-self-result]',host).forEach(x=>x.disabled=true);});
  $('.intro-save-note',host).onclick=()=>{const reason=$('.intro-reason',host).value.trim();if(!reason){$('.intro-reason',host).focus();return;}saveDraft(q,reason,origin);};
 }
 function conceptualActivity(){
  if(c.number===8||c.number===3){
   const section=document.createElement('div');section.className='intro-order';
   const steps=c.number===8?['评估','护理诊断','计划','实施','评价']:['先评估喘憋与氧合风险','评估术后疼痛及其影响','回应孤独与陪伴需要'];
   let order=c.number===8?[2,0,4,1,3]:[1,2,0];
   const draw=()=>{section.innerHTML=`<h3>${c.number===8?'把护理程序排成一个可反馈的过程':'把“先看见生命威胁”放到第一步'}</h3><div>${order.map((n,i)=>`<div class="intro-order-row"><b>${i+1}</b><span>${steps[n]}</span><button type="button" data-up="${i}" aria-label="上移${steps[n]}" ${i===0?'disabled':''}>↑</button><button type="button" data-down="${i}" aria-label="下移${steps[n]}" ${i===order.length-1?'disabled':''}>↓</button></div>`).join('')}</div><button type="button" class="intro-check-order">核对顺序</button><p class="intro-order-feedback" role="status"></p>`;
    all('[data-up],[data-down]',section).forEach(b=>b.onclick=()=>{const i=+(b.dataset.up??b.dataset.down),j=i+(b.hasAttribute('data-up')?-1:1);[order[i],order[j]]=[order[j],order[i]];draw();});
    $('.intro-check-order',section).onclick=()=>{const ok=c.number===8?order.every((x,i)=>x===i):order[0]===0;$('.intro-order-feedback',section).textContent=ok?(c.number===8?'顺序正确。评价中的新资料会进入下一轮评估；各阶段并非互不联系。':'第一判断正确。后续需结合病情、资源与患者意愿，不把所有需要固定成一条队列。'):'再看情境：先获得资料并识别风险，再决定行动。';L?.record(c.id+'-order',ok,{kind:'objective',chapter:c.id,title:c.title+'：情境排序',url:base+c.lab+'#situation'});};
   };draw();$('#chapterSituation').after(section);
  }
  if(c.number===9){
   const box=document.createElement('div');box.className='intro-orem';box.innerHTML='<h3>自理能力改变，帮助方式也改变</h3><p>选择患者状态，观察护理帮助与自主参与的关系。</p><div class="learn-buttons"><button data-capacity="0">暂不能自理</button><button data-capacity="1">可完成一部分</button><button data-capacity="2">能做，但需指导</button></div><svg viewBox="0 0 520 180" role="img" aria-label="自理能力与护理帮助关系示意"><text x="24" y="33" fill="#68478d" font-size="18">患者可自主完成的部分</text><rect x="24" y="48" width="470" height="24" rx="12" fill="#eee5f6"/><rect id="selfCareBar" x="24" y="48" width="20" height="24" rx="12" fill="#9c7bb8"/><text x="24" y="114" fill="#386e63" font-size="18">需要护士帮助或支持的部分</text><rect x="24" y="129" width="470" height="24" rx="12" fill="#e7f0ec"/><rect id="helpBar" x="24" y="129" width="470" height="24" rx="12" fill="#80b4a4"/></svg><p id="oremExplanation" role="status">完全补偿：患者暂不能完成所需自理活动。</p><p class="learn-muted">仅表示关系，不是评分量表；支持教育也属于护理帮助。</p>';
   all('[data-capacity]',box).forEach(b=>b.onclick=()=>{const n=+b.dataset.capacity;$('#selfCareBar',box).setAttribute('width',[20,235,445][n]);$('#helpBar',box).setAttribute('width',[470,265,130][n]);$('#oremExplanation',box).textContent=['完全补偿：患者暂不能完成所需自理活动。','部分补偿：患者与护士共同完成需要的照护。','支持教育：患者具有完成能力，但需要知识、技能或决策支持。'][n];all('[data-capacity]',box).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});$('#chapterSituation').after(box);
  }
 }
 if(onLab){
  conceptualActivity();
  const pool=c.questions.filter(q=>q.verified),items=pool.length?pool:c.questions;let index=0;
  const exam=$('#introExamTransfer');
  const draw=()=>{exam.innerHTML=`<label class="learn-muted">选择本章试题<select id="introQuestionSelect">${items.map((q,i)=>`<option value="${i}">${q.verified?'历年试题':'考点练习'} · ${esc(q.title.slice(0,35))}</option>`).join('')}</select></label><div id="introQuestionCard"></div>`;const render=()=>{index=+$('#introQuestionSelect').value;question(items[index],$('#introQuestionCard'),c.lab+'#'+items[index].anchor);$('#introQuestionCard h3').id=items[index].anchor;};$('#introQuestionSelect').onchange=render;const desired=items.findIndex(q=>'#'+q.anchor===location.hash);if(desired>=0)$('#introQuestionSelect').value=String(desired);render();if(desired>=0)requestAnimationFrame(()=>$('#introQuestionCard').scrollIntoView());};
  if(items.length)draw();else exam.textContent='请先完成情境判断，再回本章进行考点练习。';
  const explain=$('#introExplain');explain.innerHTML=`<p>${esc(c.story.callback)}</p><textarea id="introExplainDraft" aria-label="结构化作答" placeholder="情境：\n线索：\n概念：\n行动：\n评价："></textarea><button id="showIntroExplanation" type="button">核对判断路径</button><div id="introExplanation" hidden>${c.story.steps.map(x=>`<p><b>${esc(x[1])}：</b>${esc(x[2])}</p>`).join('')}<p class="learn-source">教材P${c.pages}</p></div>`;
  const field=$('#introExplainDraft'),key='intro-explanation-'+c.id;field.value=get(key);field.oninput=()=>set(key,field.value);$('#showIntroExplanation').onclick=()=>{$('#introExplanation').hidden=false;};
 }else{
  const practice=$('#practice .question-list');if(practice){const d=document.createElement('details');d.className='intro-supplement';d.innerHTML='<summary>展开补充情境练习</summary>';practice.before(d);d.append(practice);}
  all('#truth article.question').forEach((article,i)=>{const q=c.questions[i];if(!q)return;const head=document.createElement('div');head.id=q.anchor;head.className='intro-live-question';article.replaceChildren(head);question(q,head,c.page+'#'+q.anchor);});
  const notes=$('#studentNotes');if(notes){
   const row=document.createElement('div');row.className='intro-note-tools';row.innerHTML='<label>新增笔记内容<textarea id="introNoteDraft" placeholder="记录本次新发现的线索或错因"></textarea></label><div class="learn-buttons"><button id="introAddNote" type="button">新增笔记</button><button id="introReturn" type="button">回到做题</button></div><p class="learn-muted" id="introNoteSaveStatus" role="status"></p>';notes.before(row);
   $('#introNoteDraft').value=get(draftKey);$('#introNoteDraft').oninput=()=>set(draftKey,$('#introNoteDraft').value);
   $('#introAddNote').onclick=()=>{const draft=$('#introNoteDraft').value.trim();if(!draft){$('#introNoteDraft').focus();return;}notes.value+=(notes.value.trim()?'\n\n':'')+draft;notes.dispatchEvent(new Event('input',{bubbles:true}));$('#introNoteDraft').value='';set(draftKey,'');$('#introNoteSaveStatus').textContent='已加入本章笔记。';};
   $('#introReturn').onclick=()=>{const origin=get(originKey);location.href=/^(?:ch\d{2}|intro\d{2}-learning-lab)\.html#[\w-]+$/.test(origin)?origin:c.page+'#truth';};
  }
 }
})();
