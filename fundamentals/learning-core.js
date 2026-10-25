/* Shared learning records. A remembered checkbox is not an objective test result. */
(() => {
  'use strict';
  const KEY = 'nursing-learning-v1';
  let memory = {version:1, items:{}, events:[], last:null};
  const read = () => { try { const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(d?.version===1&&d.items&&Array.isArray(d.events)) memory=d; } catch (_) {} return memory; };
  const day = value => { const d=new Date(value===undefined?Date.now():value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const addDays = (stamp,n) => { const d=new Date(stamp); d.setDate(d.getDate()+n); return day(d); };
  const persist = data => { memory=data; try {localStorage.setItem(KEY,JSON.stringify(data)); return true;} catch (_) {return false;} };
  function record(id, ok, options={}) {
    if(typeof id!=='string'||!id||!['objective','self'].includes(options.kind||'objective')) throw Error('Invalid learning event');
    const now=options.now===undefined?Date.now():options.now, today=day(now), d=read();
    const item=d.items[id]||{id,attempts:0,streak:0};
    const kind=options.kind||'objective';
    if(kind==='objective'&&typeof ok!=='boolean') throw Error('Objective results must be boolean');
    const mode=options.assisted?'repeat':!item.attempts?'first':item.lastDay===today?'repeat':'delayed';
    const event={eventId:`${now}-${d.events.length}-${Math.random().toString(36).slice(2)}`,id,at:new Date(now).toISOString(),day:today,kind,mode,ok:!!ok,confidence:options.confidence||'unspecified',chapter:options.chapter||item.chapter||'',title:options.title||item.title||id,url:options.url||item.url||''};
    // Repeated success on the same day does not push a weak item far into the future.
    const successful=!!ok&&event.confidence!=='unsure';
    if(!successful) item.streak=0;
    else if(mode!=='repeat') item.streak=Math.min(5,(item.streak||0)+1);
    const intervals=[1,1,3,7,14,30];
    Object.assign(item,{attempts:(item.attempts||0)+1,lastDay:today,lastAt:event.at,chapter:event.chapter,title:event.title,url:event.url,kind,lastOk:!!ok,uncertain:event.confidence==='unsure',reviewReason:'',due:successful?addDays(now,intervals[item.streak||0]):today});
    item.reviewDismissed=false;
    d.items[id]=item;d.events.push(event);
    // Never silently discard a student's history.
    const saved=persist(d);
    if(saved&&kind==='objective')try{
      const key=`nursing-study-stats-${today}`,legacy=JSON.parse(localStorage.getItem(key)||'{}');
      legacy.attempts=Number(legacy.attempts||0)+1;legacy.correct=Number(legacy.correct||0)+(ok?1:0);
      localStorage.setItem(key,JSON.stringify(legacy));
    }catch(_){}
    try {window.dispatchEvent(new CustomEvent('nursing-learning-update',{detail:{event,saved}}));} catch (_) {}
    return {...event,saved};
  }
  function stats(date=day()) {
    const es=read().events.filter(e=>e.day===date&&e.kind==='objective');
    const result={};
    for(const m of ['first','repeat','delayed']) {
      const list=es.filter(e=>e.mode===m);
      result[m]={attempts:list.length,correct:list.filter(e=>e.ok).length,rate:list.length?Math.round(100*list.filter(e=>e.ok).length/list.length):null};
    }
    result.self=read().events.filter(e=>e.day===date&&e.kind==='self').length;
    result.unique=new Set(es.map(e=>e.id)).size;
    return result;
  }
  const queue = (date=day()) => Object.values(read().items).filter(i=>!i.reviewDismissed&&i.due<=date).sort((a,b)=>Number(a.lastOk)-Number(b.lastOk)||a.due.localeCompare(b.due)||a.lastAt.localeCompare(b.lastAt));
  const dismissReview = (id,dismissed=true) => {
    const d=read(),item=d.items[id];if(!item)return false;
    item.reviewDismissed=!!dismissed;item.lastAt=new Date().toISOString();
    const saved=persist(d);
    try{window.dispatchEvent(new CustomEvent('nursing-learning-update',{detail:{saved}}));}catch(_){}
    return saved;
  };
  const visit = (chapter,title,url) => {const d=read();d.last={chapter,title,url,at:new Date().toISOString()};persist(d);};
  const review = (id,options={}) => {
    const d=read(),item=d.items[id]||{id,attempts:0,streak:0,kind:'self'};
    Object.assign(item,{chapter:options.chapter||item.chapter||'',title:options.title||item.title||id,url:options.url||item.url||'',due:day(),lastAt:new Date().toISOString(),reviewReason:'先学习'});
    item.reviewDismissed=false;
    d.items[id]=item;const saved=persist(d);
    try{window.dispatchEvent(new CustomEvent('nursing-learning-update',{detail:{saved}}));}catch(_){}
    return saved;
  };
  window.NursingLearning={record,review,dismissReview,stats,queue,visit,day,read,exportData:()=>JSON.stringify(read(),null,2),importData:json=>{
    const incoming=JSON.parse(json);
    if(incoming.version!==1||!incoming.items||typeof incoming.items!=='object'||!Array.isArray(incoming.events)||incoming.events.length>200000) throw Error('不是有效的学习记录文件');
    const safeUrl=u=>typeof u==='string'&&/^(?:(?:\.\.\/)?introduction\/)?(?:ch\d\d(?:-[a-z-]+)?|intro\d\d-learning-lab|positioning-demo|admission-demo|graded-care-demo|transfer-demo)\.html(?:#[a-zA-Z0-9_-]+)?$/.test(u);
    for(const [id,i] of Object.entries(incoming.items)) if(!i||i.id!==id||typeof i.title!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(i.due)||!safeUrl(i.url))throw Error('学习条目格式不正确');
    for(const e of incoming.events)if(!e||typeof e.id!=='string'||!['objective','self'].includes(e.kind)||!['first','repeat','delayed'].includes(e.mode)||typeof e.ok!=='boolean'||!Number.isFinite(Date.parse(e.at))||!/^\d{4}-\d{2}-\d{2}$/.test(e.day))throw Error('学习事件格式不正确');
    const eventKey=e=>e.eventId||`${e.id}:${e.at}:${e.kind}`;
    const d=read(), byEvent=new Map(d.events.map(e=>[eventKey(e),e]));
    incoming.events.forEach(e=>byEvent.set(eventKey(e),e));
    for(const [id,i] of Object.entries(incoming.items))if(!d.items[id]||i.lastAt>d.items[id].lastAt)d.items[id]=i;
    d.events=[...byEvent.values()].sort((a,b)=>a.at.localeCompare(b.at));
    if(!persist(d))throw Error('本机存储空间不足，请先导出备份');
  }};
})();
