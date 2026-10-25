(() => {
  'use strict';
  const L=window.NursingLearning, data=window.NursingLearningData;
  if(!L||!data) return;
  const $=(s,r=document)=>r.querySelector(s), all=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapter=data.chapters.find(c=>c.id===document.body.dataset.learningChapter);
  const requested=location.hash.match(/^#(recall|matching|discriminate|transfer)-(.+)$/);
  const requestedId=requested?.[2]||'';
  const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const safeGet=k=>{try{return localStorage.getItem(k)||'';}catch(_){return '';}};
  const safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true;}catch(_){return false;}};
  const sourceHTML=item=>`<p class="learn-source">${esc(item.source||'本章重点整理')} · <a href="${chapter.page}#core">回到本章重点</a></p>`;
  function result(box,text,ok) {box.hidden=false;box.className=`learn-feedback ${ok===undefined?'':ok?'good':'bad'}`;box.textContent=text;}
  function record(item,ok,kind,confidence,anchor) {
    const target=item.id.replace(/-(match|transfer)$/,'');
    const e=L.record(item.id,ok,{kind,confidence,chapter:chapter.id,title:item.title,url:`${chapter.lab}#${anchor}-${target}`});
    if(!e.saved){let p=$('.learn-storage-warning');if(!p){p=document.createElement('p');p.className='learn-storage-warning';document.body.append(p);}p.textContent='当前浏览器无法保存记录，请先导出备份。';}
    return e;
  }
  function selfAssessment(host,item,anchor) {
    const row=document.createElement('div');row.className='learn-buttons';
    row.innerHTML='<button type="button" data-self="yes">能解释清楚</button><button type="button" data-self="unsure">还不确定</button><button type="button" data-self="no">需要再学</button><span class="learn-muted">自评，不计入客观正确率</span>';
    all('[data-self]',row).forEach(b=>b.onclick=()=>{
      record(item,b.dataset.self==='yes','self',b.dataset.self==='unsure'?'unsure':'sure',anchor);
      all('button',row).forEach(x=>{x.disabled=true;x.setAttribute('aria-pressed',String(x===b));});
      const p=document.createElement('p');p.className='learn-muted';p.textContent=b.dataset.self==='yes'?'已记录，之后会安排再次回忆。':'已加入待复习，先核对遗漏的条件。';row.append(p);
    });host.append(row);
  }
  function recallActivity() {
    const host=$('#recallActivity');if(!host||!chapter.core.length)return;
    host.innerHTML=`<label for="recallSelect" class="learn-muted">选择要回忆的考点</label><select id="recallSelect">${chapter.core.map((c,i)=>`<option value="${i}">${esc(c.title)}</option>`).join('')}</select><div id="recallCard"></div>`;
    const draw=()=>{
      const item=chapter.core[+$('#recallSelect').value],card=$('#recallCard');
      card.innerHTML=`<h3>试着说清楚：${esc(item.title)}</h3><label class="learn-muted" for="recallText">先写出你记得的要点与适用条件</label><textarea id="recallText" placeholder="可以只写关键词，先回忆再核对。"></textarea><button id="revealRecall" type="button">核对要点</button><div id="recallAnswer" class="learn-feedback" hidden></div>`;
      const field=$('#recallText'),key=`nursing-recall-draft-${item.id}`;field.value=safeGet(key);field.oninput=()=>safeSet(key,field.value);
      $('#revealRecall').onclick=()=>{
        const answer=$('#recallAnswer');answer.hidden=false;answer.innerHTML=`<b>核对要点</b><p>${esc(item.answer)}</p>${item.reason?`<p class="learn-muted">${esc(item.reason)}</p>`:''}${sourceHTML(item)}`;
        selfAssessment(answer,item,'recall');$('#revealRecall').disabled=true;
      };
    };$('#recallSelect').onchange=draw;
    const desired=chapter.core.findIndex(x=>x.id===requestedId);if(desired>=0)$('#recallSelect').value=String(desired);draw();
  }
  function matchingActivity() {
    const host=$('#matchActivity');if(!host)return;
    const numeric=chapter.numbers.length>=3;
    const pool=numeric?chapter.numbers:chapter.core,target=pool.find(x=>x.id===requestedId);
    const chosen=target?[target,...shuffle(pool.filter(x=>x!==target)).slice(0,3)]:shuffle(pool).slice(0,4);
    const pairs=chosen.map((x,i)=>({...x,key:i,right:x.answer}));
    if(pairs.length<2){host.innerHTML='<p>本章以概念理解为主，请完成主动回忆和辨析。</p>';return;}
    if(!numeric)$('#matching h2').textContent='把概念和教材要点连起来';
    let selected=null,matched=new Set();
    host.innerHTML=`<p class="learn-muted">先选左侧对象，再选右侧${numeric?'数值':'描述'}。${numeric?'适用条件会在答对后显示。':''}</p><div class="learn-match"><div>${pairs.map(p=>`<button type="button" data-left="${p.key}" aria-pressed="false">${esc(p.title)}</button>`).join('')}</div><div>${shuffle(pairs).map(p=>`<button type="button" data-right="${p.key}">${esc(p.right)}</button>`).join('')}</div></div><div id="matchFeedback" class="learn-feedback" role="status" hidden></div><button id="restartMatch" type="button">换一组练习</button>`;
    all('[data-left]',host).forEach(b=>b.onclick=()=>{
      if(b.disabled)return;selected=Number(b.dataset.left);all('[data-left]',host).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    });
    all('[data-right]',host).forEach(b=>b.onclick=()=>{
      if(selected===null||b.disabled)return;
      const p=pairs.find(x=>x.key===selected),ok=Number(b.dataset.right)===selected;
      // Identical answer labels cannot be reliably scored as distinct matching targets.
      const equalText=pairs.filter(x=>x.right===p.right).some(x=>x.key===Number(b.dataset.right));
      const correct=ok||equalText;
      record({...p,id:`${p.id}-match`},correct,'objective','sure','matching');
      const fb=$('#matchFeedback');
      if(correct){
        const left=$(`[data-left="${selected}"]`,host);left.disabled=true;left.classList.add('matched');left.setAttribute('aria-pressed','false');b.disabled=true;b.classList.add('matched');matched.add(p.key);selected=null;
        fb.hidden=false;fb.className='learn-feedback good';fb.innerHTML=`<b>✓ 配对正确 · ${matched.size}/${pairs.length}</b><p>${esc(p.title)}：${esc(p.answer)}</p>${p.condition?`<p>适用条件：${esc(p.condition)}</p>`:''}${sourceHTML(p)}`;
      }else result(fb,'这组不匹配。对照对象、单位和适用条件，再判断一次。',false);
    });$('#restartMatch').onclick=matchingActivity;
  }
  function comparisonActivity() {
    const host=$('#compareActivity');if(!host)return;
    if(!chapter.compare.length){host.innerHTML='<p>请用本章核心概念解释一道刷题训练。</p>';return;}
    host.innerHTML=`<label class="learn-muted" for="compareSelect">选择一组易混点</label><select id="compareSelect">${chapter.compare.map((c,i)=>`<option value="${i}">${esc(c.title)}</option>`).join('')}</select><div id="compareCard"></div>`;
    const draw=()=>{
      const idx=+$('#compareSelect').value,c=chapter.compare[idx],card=$('#compareCard');
      card.innerHTML=`<h3>${esc(c.title)}</h3><p>它们在哪个条件下会产生不同判断？</p><textarea aria-label="写出两者的决定性区别" placeholder="先写决定性区别，再核对。"></textarea><button id="showComparison" type="button">核对区别</button><div id="compareAnswer" class="learn-feedback" hidden></div>`;
      const draft=card.querySelector('textarea'),key=`nursing-compare-draft-${chapter.id}-${idx}`;draft.value=safeGet(key);draft.oninput=()=>safeSet(key,draft.value);
      $('#showComparison').onclick=()=>{
        const answer=$('#compareAnswer');answer.hidden=false;answer.innerHTML=c.items.map(p=>`<p>${esc(p)}</p>`).join('')+`<a href="${chapter.page}#compare">回看易混对照</a>`;
        selfAssessment(answer,{id:`${chapter.id}-compare-${idx}`,title:c.title},'discriminate');$('#showComparison').disabled=true;
      };
    };$('#compareSelect').onchange=draw;
    const wanted=requestedId.match(/-compare-(\d+)$/);if(wanted&&chapter.compare[+wanted[1]])$('#compareSelect').value=wanted[1];draw();
  }
  function transferActivity() {
    const host=$('#transferActivity');if(!host)return;
    const items=chapter.numbers.length?chapter.numbers:chapter.core;
    const item=items.find(x=>x.id===requestedId)||items[Math.floor(Math.random()*items.length)];if(!item)return;
    host.innerHTML=`<p class="learn-muted">教材要点回忆 · ${esc(item.source||'本章重点')}</p><h3>${esc(item.title)}${item.condition?'在下列条件下应记住什么？':'的关键判断是什么？'}</h3>${item.condition?`<blockquote>${esc(item.condition)}</blockquote>`:''}<textarea aria-label="写出你的答案与理由" placeholder="写出结论，并补上单位、适用条件或理由。"></textarea><button id="checkTransfer" type="button">核对并解释</button><div id="transferFeedback" class="learn-feedback" hidden></div><div class="learn-buttons"><button id="nextTransfer" type="button">换一个考点</button><a class="learn-primary" href="${chapter.page}#exam">进入10道刷题训练 →</a></div>`;
    $('#checkTransfer').onclick=()=>{const fb=$('#transferFeedback');fb.hidden=false;fb.innerHTML=`<p>${esc(item.answer)}</p>${sourceHTML(item)}`;selfAssessment(fb,{...item,id:`${item.id}-transfer`},'transfer');$('#checkTransfer').disabled=true;};
    $('#nextTransfer').onclick=transferActivity;
  }
  function enhanceQuestions() {
    const cards=all('#exam .question');
    cards.forEach((card,i)=>{
      const q=chapter.questions[i];if(!q)return;
      card.id=`exam-${i+1}`;card.classList.add('learn-ui');
      const oldList=$('.options',card),detail=$('details',card);if(!detail)return;
      const source=$('.source',detail)?.textContent||q.source;
      // Replace unsupported generic rationales with a clearly labelled reference and reasoning task.
      detail.innerHTML=`<summary>查看参考答案与核对提示</summary><div class="answer"><p class="direct"><b>参考答案：</b>${esc(q.answer.replace(/^(正确答案|答案)[：:]\s*/,''))}</p><p><b>核对提示：</b>先圈出设问中的对象、阶段与否定词，再说明选项成立所需的条件。</p><p class="source">教材定位：${esc(source||'见本章')}。题源与答案待原卷核实。</p><label for="reason-${i}">用一句话写出你排除干扰项的理由</label><textarea id="reason-${i}" class="learn-reason" placeholder="我选择……，因为题干中的……"></textarea><div class="learn-buttons"><button type="button" class="learn-save-reason">保存到本章笔记</button><a href="${chapter.lab}#discriminate">练易混辨析 →</a></div></div>`;
      const draft=$('textarea',detail),draftKey=`nursing-exam-reason-${q.id}`;draft.value=safeGet(draftKey);draft.oninput=()=>safeSet(draftKey,draft.value);
      $('.learn-save-reason',detail).onclick=()=>{
        const text=draft.value.trim();if(!text){draft.focus();return;}
        const title=$('#noteTitle'),body=$('#noteBody');
        if(title&&body){title.value=q.topic||'刷题错因';body.value=`题目：${q.title}\n正确答案：${q.answer.replace(/^(正确答案|答案)[：:]\s*/,'')}\n我的理由：${text}\n来源：${q.paper}\n${q.source}`;safeSet(`nursing-note-origin-${chapter.id}`,card.id);location.hash='notes';body.focus();}
      };
      const valid=q.correct.length>0&&q.correct.every(letter=>q.options.some(o=>new RegExp(`^${letter}[.．、\\s]`).test(o)));
      const block=document.createElement('div');block.className='learn-question-control';
      if(valid&&oldList){
        oldList.hidden=true;
        block.innerHTML=`<div class="learn-question-options" role="group" aria-label="${q.correct.length>1?'选择所有正确选项':'选择一个答案'}">${q.options.map((o,j)=>`<label><input type="${q.correct.length>1?'checkbox':'radio'}" name="${q.id}" value="${esc(o.match(/^[A-E]/)?.[0]||String(j))}"><span>${esc(o)}</span></label>`).join('')}</div><fieldset class="learn-confidence"><legend>作答把握</legend><label><input type="radio" name="confidence-${q.id}" value="sure" checked> 比较确定</label> <label><input type="radio" name="confidence-${q.id}" value="unsure"> 不太确定</label></fieldset><div class="learn-buttons"><button class="learn-submit" type="button">提交判断</button><button class="learn-skip" type="button">不会，先学习</button></div><div class="learn-feedback" role="status" hidden></div>`;
        const submit=$('.learn-submit',block),fb=$('.learn-feedback',block);
        const skipButton=$('.learn-skip',block),retry=document.createElement('button');
        retry.type='button';retry.className='learn-retry';retry.textContent='重新作答';retry.hidden=true;
        $('.learn-buttons',block).append(retry);
        const next=document.createElement('a');next.className='learn-primary learn-next';next.href=i+1<cards.length?`#exam-${i+2}`:`${chapter.lab}`;next.textContent=i+1<cards.length?'下一题 →':'去互动强化 →';next.hidden=true;block.append(next);
        let submitted=false,exposed=false;
        retry.onclick=()=>{
          submitted=false;
          all('input,button',block).forEach(x=>x.disabled=false);
          all('.learn-question-options input',block).forEach(x=>x.checked=false);
          detail.open=false;detail.hidden=true;fb.hidden=true;next.hidden=true;retry.hidden=true;
          $('.learn-question-options input',block)?.focus();
        };
        const finish=(skip=false)=>{
          if(submitted)return;
          if(skip){
            const saved=L.review(q.id,{chapter:chapter.id,title:q.title.slice(0,65),url:`${chapter.page}#${card.id}`});
            exposed=true;detail.hidden=false;detail.open=true;skipButton.disabled=true;
            result(fb,'已展开解析并加入待复习，不计为答错。看完后点“重新作答”，也可以直接选择答案。');
            if(!saved)fb.textContent+=' 当前记录未能保存，请导出备份。';
            retry.textContent='重新作答';retry.hidden=false;next.hidden=false;return;
          }
          const selected=all('.learn-question-options input:checked',block).map(x=>x.value).sort();
          if(!selected.length){result(fb,'请先选择答案。');return;}
          const ok=selected.join('')===[...q.correct].sort().join(''),confidence=$(`[name="confidence-${q.id}"]:checked`,block)?.value||'unsure';
          const e=L.record(q.id,ok,{kind:'objective',confidence,assisted:exposed,chapter:chapter.id,title:q.title.slice(0,65),url:`${chapter.page}#${card.id}`});
          submitted=true;exposed=true;
          result(fb,ok?`✓ 回答正确。${confidence==='unsure'?'把握不足，已加入复习。':'再检查一下自己的理由。'}`:'再想一想：留意题干的关键线索和选项的适用条件。',ok);
          if(!e.saved)fb.textContent+=' 当前记录未能保存，请导出备份。';
          all('input,button',block).forEach(x=>x.disabled=true);detail.hidden=false;detail.open=true;
          retry.disabled=false;retry.hidden=false;retry.textContent='再练一次';next.hidden=false;
        };
        submit.onclick=()=>finish(false);$('.learn-skip',block).onclick=()=>finish(true);
        detail.hidden=true;
      }else{
        block.innerHTML='<p class="learn-muted">回忆题：先在心里组织答案，再核对。</p><button type="button">核对参考答案</button>';
        detail.hidden=true;$('button',block).onclick=()=>{detail.hidden=false;detail.open=true;};
      }
      detail.before(block);
    });
    const head=$('#exam h2');if(head)head.textContent='刷题训练';
    const para=$('#exam .section-head p');if(para)para.textContent='先独立作答，再核对答案、条件与教材依据。';
    const badge=$('#exam .section-head .level, #exam .section-head .badge');if(badge)badge.textContent='10题 · 先答后看';
  }
  function addNoteReturn() {
    const add=$('#addNote');if(!add||$('#returnToQuestion'))return;
    const group=document.createElement('div');group.className='learn-note-actions';
    add.before(group);group.append(add);
    const back=document.createElement('button');back.id='returnToQuestion';back.type='button';back.textContent='回到做题';back.setAttribute('aria-label','回到刚才的题目');group.append(back);
    $('#exam')?.addEventListener('click',event=>{const card=event.target.closest('.question');if(card?.id)safeSet(`nursing-note-origin-${chapter.id}`,card.id);});
    back.onclick=()=>{
      const id=safeGet(`nursing-note-origin-${chapter.id}`);
      const card=/^exam-\d+$/.test(id)?document.getElementById(id):null;
      const target=card||all('#exam .question').find(q=>$('.learn-submit:not(:disabled)',q))||$('#exam');
      if(!target)return;
      location.hash=target.id;
      target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      const focus=$('.learn-retry:not([hidden]):not(:disabled), .learn-question-options input:not(:disabled), summary',target);
      focus?.focus({preventScroll:true});
    };
  }
  function enhanceChapter() {
    document.body.classList.add('learn-ui');
    const core=$('#core');if(core){
      const goals=document.createElement('div');goals.className='learn-goals';goals.setAttribute('aria-label','本章学习目标');
      goals.innerHTML='<span>说清核心概念</span><span>辨认数值与条件</span><span>解释易混区别</span><span>完成独立判断</span>';$('.section-head',core)?.after(goals);
      all('.core-card',core).forEach(c=>{const label=$('.master',c);if(label){const input=$('input',label);if(input){label.replaceChildren(input,document.createTextNode(' 已复盘'));}}});
    }
    const existing=$('#practice');
    if(existing){
      const h=$('h2',existing);if(h)h.textContent='用互动检验并强化学习';
      if(!existing.querySelector('[data-chapter-lab]')){const a=document.createElement('a');a.className='learn-primary';a.dataset.chapterLab='';a.href=chapter.lab;a.textContent='进入本章实验室 →';(existing.querySelector('.lab-links,.cta-actions,.actions')||existing).append(a);}
    }else{
      const section=document.createElement('section');section.id='practice';section.className='learn-bridge';section.innerHTML=`<h2>用互动检验并强化学习</h2><div class="learn-actions"><a href="${chapter.lab}" class="learn-primary">进入本章实验室 →</a><a href="#exam" class="learn-primary">刷题训练</a><a href="progress.html" class="learn-primary">学习台</a></div>`;
      ($('#compare')||$('#numbers')||core)?.after(section);
    }
    const toolbar=$('.toolbar');if(toolbar&&!toolbar.querySelector('a[href="progress.html"]'))toolbar.insertAdjacentHTML('beforeend','<a href="#practice">互动练习</a><a href="progress.html">学习台</a>');
    enhanceQuestions();addNoteReturn();
    all('.question .qnum').forEach((el,i)=>el.textContent=String(i+1));
  }
  function download(name,text) {
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  const toolsBase=new URL('.',document.currentScript.src);
  let toolsPromise;
  function getTools(){
    if(window.NursingLearningTools)return Promise.resolve(window.NursingLearningTools);
    if(!toolsPromise)toolsPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('learning-tools.js?v=20261026b',toolsBase);script.onload=()=>resolve(window.NursingLearningTools);script.onerror=()=>{toolsPromise=null;reject(Error('记录工具未能加载，请稍后重试。'));};document.body.append(script);});
    return toolsPromise;
  }
  let dismissedReviewId=null;
  function renderDashboard() {
    const s=L.stats(),section=$('#learning-dashboard'),q=L.queue(),last=L.read().last;if(!section)return;
    const backupPanel=section.querySelector('.learn-backup-panel');backupPanel?.remove();
    const reviewDrawer=section.querySelector('.learn-home-records');if(reviewDrawer)section.dataset.mobileReviewOpen=String(reviewDrawer.open);
    const escapeLink=u=>/^(?:(?:\.\.\/)?introduction\/)?(?:ch\d\d(?:-[a-z-]+)?|intro\d\d-learning-lab|positioning-demo|admission-demo|graded-care-demo|transfer-demo)\.html(?:#[\w-]+)?$/.test(u||'')?u:'index.html';
    const metric=(label,r)=>`<article class="learn-metric ${r.rate===null?'':r.rate>=60?'good':'low'}"><span>${label}</span><b>${r.rate===null?'—':r.rate+'%'}</b><small>${r.attempts?`${r.correct}/${r.attempts} 次回答正确`:'暂无作答'}</small></article>`;
    section.innerHTML=`<div class="section-head"><div><p class="learn-kicker">继续你的学习节奏</p><h2>今日学习与待复习</h2></div><span class="learn-badge">${esc(L.day())}</span></div>${last?`<p class="learn-resume">上次学习：<a href="${escapeLink(last.url)}">${esc(last.title)} · 继续 →</a></p>`:''}<div class="learn-metrics">${metric('首次作答',s.first)}${metric('当日重复练习',s.repeat)}${metric('隔日复测',s.delayed)}</div><p class="learn-muted">今日客观练习 ${s.unique} 个不同考点 · 自评回忆 ${s.self} 次。历史互动总次数另见原有统计。</p><h3 id="review-queue">待复习 <span class="learn-badge">${q.length}</span></h3>${q.length?`<ul class="learn-review-list">${q.slice(0,8).map(i=>`<li><div><b>${esc(i.title)}</b><small>${i.reviewReason||(i.kind==='self'?'自评回忆':i.lastOk?(i.uncertain?'答对但没把握':'间隔复测'):'上次答错')} · ${esc(i.due)}</small></div><div class="learn-review-actions"><a href="${escapeLink(i.url)}">去复习 →</a><button type="button" data-dismiss-review="${esc(i.id)}" aria-label="移出待复习：${esc(i.title)}">移出</button></div></li>`).join('')}</ul>`:'<p class="learn-muted">现在没有到期条目。完成刷题或回忆后，会生成复习安排。</p>'}<details class="learn-muted learn-backup-panel"><summary>记录与备份</summary><p>记录保存在当前浏览器；不同手机和电脑不会自动同步。可导出、导入学习记录。复习间隔是初始规则，会根据实际使用调整。</p><div class="learn-buttons"><button type="button" id="exportLearning">导出记录</button><button type="button" id="importLearning" aria-describedby="importFormatHint">导入记录</button></div><p id="importFormatHint">支持本网页导出的 .json 文件，兼容旧版；也可复制完整记录后粘贴导入。普通笔记文档不能导入这里。</p><p id="importStatus" role="status"></p></details>`;
    if(backupPanel)section.querySelector('.learn-backup-panel').replaceWith(backupPanel);
    const notice=document.createElement('p');notice.className='learn-review-notice';notice.setAttribute('role','status');
    if(dismissedReviewId){
      notice.append('已移出待复习，答题记录已保留。');
      const undo=document.createElement('button');undo.type='button';undo.textContent='撤销';
      undo.onclick=()=>{const id=dismissedReviewId;dismissedReviewId=null;L.dismissReview(id,false);};notice.append(undo);
    }
    $('#review-queue').after(notice);
    all('[data-dismiss-review]',section).forEach(button=>button.onclick=()=>{
      const index=all('[data-dismiss-review]',section).indexOf(button);
      dismissedReviewId=button.dataset.dismissReview;
      if(!L.dismissReview(dismissedReviewId))notice.textContent='未能保存清理结果，请检查浏览器存储空间。';
      const next=all('[data-dismiss-review]',section);(next[Math.min(index,next.length-1)]||$('.learn-review-notice button',section))?.focus({preventScroll:true});
    });
    for(const [id,mode] of [['exportLearning','export'],['importLearning','import']])$('#'+id).onclick=()=>getTools().then(t=>t.openBackup(mode)).catch(err=>{$('#importStatus').textContent=err.message;});
    window.dispatchEvent(new Event('nursing-dashboard-rendered'));
  }
  if(chapter) {
    if(document.body.hasAttribute('data-learning-lab')) {recallActivity();matchingActivity();comparisonActivity();transferActivity();}
    else enhanceChapter();
    L.visit(chapter.id,chapter.title,document.body.hasAttribute('data-learning-lab')?chapter.lab:chapter.page);
    if(requested)requestAnimationFrame(()=>document.getElementById(requested[1])?.scrollIntoView());
  }
  if(document.body.hasAttribute('data-learning-dashboard')) {
    const section=document.createElement('section');section.id='learning-dashboard';section.className='learn-section learn-ui';
    const main=$('.wrap,main,.container')||document.body,hero=$('header.hero,.hero',main);
    if(hero)hero.after(section);else main.prepend(section);renderDashboard();
    getTools().catch(()=>{});
    addEventListener('nursing-learning-update',renderDashboard);addEventListener('storage',e=>{if(e.key===null||e.key==='nursing-learning-v1')renderDashboard();});
  }
  all('[data-font]').forEach(b=>b.onclick=()=>{const current=Number(safeGet('nursing-learning-font')||17),next=Math.min(23,Math.max(16,current+Number(b.dataset.font)));safeSet('nursing-learning-font',String(next));document.documentElement.style.setProperty('--learn-font',next+'px');});
  const font=Number(safeGet('nursing-learning-font'));if(font>=16&&font<=23)document.documentElement.style.setProperty('--learn-font',font+'px');
})();
