/* Sequential anatomical tour. Figure adaptation: CC BY-SA 3.0, see assets/heart-anatomy-LICENSE.txt. */
(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg',reduced=matchMedia('(prefers-reduced-motion:reduce)');
 // Coordinates share the original SVG viewBox. Halos locate structures; they do not depict trajectories through tissue.
 const marks={svc:[367,239,20,63],ivc:[382,588,27,36],ra:[373,369,44,45],tricuspid:[417,429,29,17],rv:[466,491,38,48],pulmonaryValve:[508,350,25,18],pa:[547,268,50,24],pv:[631,310,25,19],la:[596,357,28,28],mitral:[565,407,22,21],lv:[616,499,28,48],aorticValve:[554,363,15,17],aorta:[503,208,49,44]};
 const steps=[
  {title:'体静脉回流',path:'上、下腔静脉 → 右心房',why:'全身回流的缺氧血先进入右心房。先认图中的腔静脉入口。',marks:['svc','ivc','ra'],side:'blue'},
  {title:'进入右心室',path:'右心房 → 三尖瓣 → 右心室',why:'房室瓣控制血液从心房进入心室的方向。右侧房室瓣为三尖瓣。',marks:['ra','tricuspid','rv'],side:'blue'},
  {title:'送往肺循环',path:'右心室 → 肺动脉瓣 → 肺动脉',why:'右心室将缺氧血泵向肺。肺动脉虽然叫“动脉”，其中的血液仍含氧较低。',marks:['rv','pulmonaryValve','pa'],side:'blue'},
  {title:'肺内气体交换',path:'肺毛细血管：摄取氧、排出二氧化碳',why:'这一段发生在肺内，当前心脏剖面图不显示肺组织；不能把气体交换画在心腔里。',marks:[],side:'exchange'},
  {title:'回到左心房',path:'肺静脉 → 左心房',why:'在肺完成气体交换后，含氧较高的血液经肺静脉回到左心房。',marks:['pv','la'],side:'red'},
  {title:'进入左心室',path:'左心房 → 二尖瓣 → 左心室',why:'左侧房室瓣为二尖瓣。通过它，血液进入负责体循环射血的左心室。',marks:['la','mitral','lv'],side:'red'},
  {title:'泵向全身',path:'左心室 → 主动脉瓣 → 主动脉',why:'左心室射血进入主动脉，为全身脏器供血；心排血量下降时，要关注重要器官灌注。',marks:['lv','aorticValve','aorta'],side:'red'},
  {title:'体循环后再回流',path:'全身组织交换 → 体静脉 → 腔静脉',why:'组织利用氧后，血液经体静脉回流，进入下一轮循环。循环通路连续，这里分段是为了看清顺序。',marks:['svc','ivc'],side:'blue'}
 ];
 const segments={
  0:['M367 185C367 240 365 295 373 342'],
  1:['M373 367C388 391 405 415 420 435S448 472 466 491'],
  2:['M466 491C450 458 460 409 489 373S518 323 525 300S557 260 600 238'],
  3:[],
  4:['M650 304C631 308 614 322 596 357'],
  5:['M596 357C587 380 572 398 565 413S593 472 616 499'],
  6:['M616 499C599 465 574 419 554 368','M503 208C489 179 464 168 444 185'],
  7:['M367 185C367 240 365 295 373 342']
 };
 document.querySelectorAll('.hf-anatomy-figure').forEach((figure,index)=>{
  if(figure.dataset.flowReady)return;figure.dataset.flowReady='true';
  const link=figure.querySelector('.hf-anatomy-open'),image=link?.querySelector('img');if(!image)return;
  const wrapper=document.createElement('div');wrapper.className='hf-flow-image';image.before(wrapper);wrapper.append(image);
  const svg=document.createElementNS(ns,'svg');svg.classList.add('hf-flow-overlays');svg.setAttribute('viewBox','121 0 754 703');svg.setAttribute('aria-hidden','true');
  const groups={};for(const [name,[cx,cy,rx,ry]] of Object.entries(marks)){const g=document.createElementNS(ns,'g');g.classList.add('hf-flow-mark');g.dataset.mark=name;g.setAttribute('hidden','');const ellipse=document.createElementNS(ns,'ellipse');for(const [key,value] of Object.entries({cx,cy,rx,ry}))ellipse.setAttribute(key,value);g.append(ellipse);svg.append(g);groups[name]=g;}
  const flows={};for(const [n,paths] of Object.entries(segments)){const g=document.createElementNS(ns,'g');g.classList.add('hf-flow-segment');g.dataset.step=n;g.setAttribute('hidden','');g.dataset.side=steps[n].side;for(const path of paths){const line=document.createElementNS(ns,'path');line.setAttribute('d',path);line.classList.add('hf-flow-line');g.append(line);for(const begin of ['0s','-1.1s']){const dot=document.createElementNS(ns,'circle');dot.setAttribute('r','4.5');dot.classList.add('hf-flow-dot');const motion=document.createElementNS(ns,'animateMotion');motion.setAttribute('dur','2.2s');motion.setAttribute('repeatCount','indefinite');motion.setAttribute('path',path);motion.setAttribute('begin',begin);motion.setAttribute('calcMode','paced');dot.append(motion);g.append(dot);}}svg.append(g);flows[n]=g;}wrapper.append(svg);
  const panel=document.createElement('div');panel.className='hf-flow-panel';panel.innerHTML=`<div class="hf-flow-toolbar"><b>血流动态导览</b><div><button type="button" data-flow="previous" aria-label="上一步血流">上一步</button><button type="button" data-flow="play">播放</button><button type="button" data-flow="next" aria-label="下一步血流">下一步</button><button type="button" data-flow="reset">重置</button></div></div><ol class="hf-flow-steps" aria-label="血流路径八个阶段">${steps.map((s,i)=>`<li><button type="button" data-flow-step="${i}" aria-label="第${i+1}步：${s.title}"><span>${i+1}</span>${s.title}</button></li>`).join('')}</ol><div class="hf-flow-current"><p class="hf-flow-state"></p><h3></h3><p class="hf-flow-route"></p><p class="hf-flow-explain"></p></div><p class="hf-flow-note">光圈定位结构，光点示意通路方向。深部被遮挡的结构分段显示；播放速度不代表实际血流速度或心率。<a href="https://www.nhlbi.nih.gov/health/heart/blood-flow" target="_blank" rel="noopener">血流顺序依据：NHLBI</a></p>`;
  figure.append(panel);const find=s=>panel.querySelector(s);let step=0,wantsPlay=!reduced.matches,visible=false,timer=null;const dialog=document.getElementById('hfAnatomyDialog');
  function render(){const current=steps[step];for(const [name,g] of Object.entries(groups)){g.toggleAttribute('hidden',!current.marks.includes(name));g.dataset.side=current.side;}for(const [n,g] of Object.entries(flows))g.toggleAttribute('hidden',+n!==step);if(figure.dataset.flowStep!==String(step))svg.setCurrentTime(0);figure.dataset.flowStep=String(step);figure.dataset.flowPlaying=String(wantsPlay);figure.classList.toggle('hf-flow-paused',!wantsPlay);find('[data-flow=play]').textContent=wantsPlay?'暂停':'播放';find('[data-flow=play]').setAttribute('aria-pressed',String(wantsPlay));find('.hf-flow-state').textContent=`第 ${step+1} / ${steps.length} 步 · ${current.side==='red'?'含氧较高':current.side==='blue'?'含氧较低':'肺内气体交换'}`;find('.hf-flow-state').dataset.side=current.side;find('.hf-flow-current h3').textContent=current.title;find('.hf-flow-route').textContent=current.path;find('.hf-flow-explain').textContent=current.why;panel.querySelectorAll('[data-flow-step]').forEach(b=>{const active=+b.dataset.flowStep===step;b.setAttribute('aria-current',active?'step':'false');b.setAttribute('aria-pressed',String(active));});}
  function schedule(){clearTimeout(timer);timer=null;const bounds=figure.getBoundingClientRect();visible=bounds.bottom>0&&bounds.top<innerHeight;const active=wantsPlay&&visible&&!document.hidden&&!dialog?.open;if(active){svg.unpauseAnimations();timer=setTimeout(()=>{step=(step+1)%steps.length;render();schedule();},3000);}else svg.pauseAnimations();}
  function move(n){wantsPlay=false;step=(n+steps.length)%steps.length;render();schedule();}
  find('[data-flow=play]').onclick=()=>{wantsPlay=!wantsPlay;render();schedule();};find('[data-flow=next]').onclick=()=>move(step+1);find('[data-flow=previous]').onclick=()=>move(step-1);find('[data-flow=reset]').onclick=()=>move(0);panel.querySelectorAll('[data-flow-step]').forEach(b=>b.onclick=()=>move(+b.dataset.flowStep));
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0});observer.observe(figure);document.addEventListener('visibilitychange',schedule);if(dialog)new MutationObserver(schedule).observe(dialog,{attributes:true,attributeFilter:['open']});reduced.addEventListener('change',()=>{if(reduced.matches){wantsPlay=false;render();schedule();}});render();
  const caption=figure.querySelector('figcaption');if(caption)caption.innerHTML='心脏前面观：图左为患者右侧。红、蓝用于区分含氧血与缺氧血通路；可暂停观察、逐步查看，点击图可放大。';
 });
})();
