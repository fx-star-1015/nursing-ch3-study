from __future__ import annotations

import os
import sys
from pathlib import Path


MOBILE_CSS = r'''/* Shared mobile reading layer for every study page. */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;overflow-wrap:anywhere}
body{overflow-x:hidden}
img,svg,video,canvas{max-width:100%;height:auto}
button,a,input,textarea,select{touch-action:manipulation}

/* One note, three moments: outline before questions, repair after questions,
   and a fuller chapter notebook at the end. */
.flow-note{margin:17px 0;padding:18px;border:1px solid #d9ccef;border-radius:18px;background:linear-gradient(145deg,#fff,#faf7ff);box-shadow:0 10px 24px rgba(82,55,130,.07);scroll-margin-top:82px}
.flow-note-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:11px}
.flow-note-head h2,.flow-note-head h3{margin:0;color:#4f367d;font-size:20px;line-height:1.4}
.flow-note-head p{margin:4px 0 0;color:#6e6781;line-height:1.65}
.flow-note-tag{flex:0 0 auto;padding:4px 9px;border-radius:99px;background:#eee7ff;color:#7151b7;font-size:12px;font-weight:900}
.pre-quiz-area{width:100%;min-height:126px;resize:vertical;padding:13px 14px;border:1px solid #d8cdef;border-radius:13px;background:#fff;color:#29243a;font:inherit;line-height:1.7}
.flow-note-status{margin-top:7px;color:#277b66;font-size:12px;font-weight:800}
.post-quiz-note{display:flex;justify-content:space-between;align-items:center;gap:16px;background:#f1faf7;border-color:#bfe2d8}
.post-quiz-note h3{margin:0 0 4px;color:#315e53;font-size:18px}
.post-quiz-note p{margin:0;color:#466b62}
.note-jumps{display:flex;flex-wrap:wrap;gap:8px;flex:0 0 auto}
.note-jump{display:inline-flex;align-items:center;min-height:38px;padding:7px 11px;border:1px solid #addacc;border-radius:10px;background:#fff;color:#277b66;text-decoration:none;font-weight:900;white-space:nowrap}
.table-context-badge{display:inline-flex;margin-left:7px;padding:3px 8px;border-radius:99px;background:#eee7ff;color:#7151b7;font-size:12px;font-weight:900;line-height:1.4;vertical-align:middle;white-space:nowrap}
.chapter-page-range{display:inline-flex;margin-left:9px;padding:3px 9px;border-radius:99px;background:#f0e9ff;color:#7151b7;font-size:12px;font-weight:900;line-height:1.4;vertical-align:middle;white-space:nowrap}
.learning-path{margin:15px 0 18px;padding:18px;border:1px solid #d9ccef;border-radius:19px;background:linear-gradient(145deg,#fff,#f7f2ff);box-shadow:0 10px 28px rgba(82,55,130,.08)}
.learning-path-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px}
.learning-path-head h2{margin:0;color:#3f2d64;font-size:21px;line-height:1.35}
.learning-path-head p{margin:4px 0 0;color:#6e6781;font-size:13px}
.learning-path-progress{flex:0 0 auto;padding:5px 10px;border-radius:99px;background:#eee7ff;color:#7151b7;font-size:12px;font-weight:900}
.learning-steps{display:grid;grid-template-columns:repeat(7,minmax(132px,1fr));gap:8px;list-style:none;margin:0;padding:0;overflow-x:auto;overscroll-behavior-inline:contain;scrollbar-width:thin}
.learning-step{position:relative;display:flex;flex-direction:column;min-width:0;border:1px solid #ded4f0;border-radius:14px;background:#fff;overflow:hidden;transition:.18s ease}
.learning-step.done{border-color:#9fd2c5;background:#f2fbf8}
.learning-step.done .step-number{background:#277b66}
.step-link{display:block;flex:1;padding:11px 10px 8px;color:#29243a;text-decoration:none}
.step-number{display:grid;place-items:center;width:26px;height:26px;margin-bottom:7px;border-radius:50%;background:#7151b7;color:#fff;font-size:12px;font-weight:900}
.step-link b{display:block;color:#49356f;font-size:14px;line-height:1.4}
.step-link span{display:block;margin-top:5px;color:#6e6781;font-size:11px;line-height:1.55}
.step-link small{display:block;margin-top:6px;color:#7151b7;font-size:10px;line-height:1.45}
.step-check{margin:0 9px 9px;padding:5px 7px;border:1px solid #ded4f0;border-radius:8px;background:#faf8ff;color:#7151b7;font-family:inherit;font-size:11px;font-weight:800;line-height:1.35;cursor:pointer}
.learning-step.done .step-check{border-color:#9fd2c5;background:#fff;color:#277b66}
.mood-diary{margin:18px 0 5px;padding:14px 16px;border:1px solid #d9ccef;border-radius:16px;background:linear-gradient(135deg,#fff,#f7f2ff);box-shadow:0 8px 22px rgba(82,55,130,.07)}
.mood-diary-row{display:flex;align-items:center;gap:10px}
.mood-diary-title{flex:0 0 auto;color:#4f367d;font-size:15px;font-weight:900;white-space:nowrap}
.mood-diary-input{flex:1;min-width:0;height:40px;padding:8px 11px;border:1px solid #d8cdef;border-radius:10px;background:#fff;color:#29243a;font:inherit}
.mood-diary-input:focus{outline:2px solid #bca9e8;outline-offset:1px}
.mood-diary-status{flex:0 0 auto;color:#277b66;font-size:11px;font-weight:800;white-space:nowrap}
.mood-quote{display:flex;align-items:center;gap:8px;margin-top:9px;color:#65547e;font-size:13px;line-height:1.6}
.mood-quote-text{flex:1}
.mood-refresh{flex:0 0 auto;padding:4px 8px;border:1px solid #d8cdef;border-radius:9px;background:#fff;color:#7151b7;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}

@media(max-width:760px){
  body{font-size:15px!important;line-height:1.72!important}
  .shell,.wrap,.container{width:100%!important;max-width:none!important;padding:8px!important}
  .hero{padding:21px 15px!important;border-radius:18px!important}
  .hero h1{font-size:clamp(25px,8vw,34px)!important;line-height:1.22!important;margin:7px 0 10px!important}
  .hero p{font-size:14px!important;line-height:1.65!important}
  .eyebrow{font-size:11px!important;letter-spacing:.08em!important}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:15px!important}
  .stat{min-width:0!important;padding:10px!important;border-radius:13px!important}
  .stat b{font-size:18px!important;line-height:1.25!important}
  .stat span{font-size:11px!important;line-height:1.4!important}

  .modebar{position:static!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;padding:8px!important;margin-top:9px!important}
  .modebar>span{grid-column:1/-1!important;margin:0!important}
  .modebar button,.mode-btn{min-height:42px!important;padding:8px 5px!important;white-space:normal!important;line-height:1.25!important}
  .toolbar{position:sticky!important;top:0!important;z-index:50!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:7px!important;max-width:100%!important;margin:9px 0!important;padding:7px!important;overflow-x:auto!important;overscroll-behavior-inline:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important}
  .toolbar::-webkit-scrollbar{display:none!important}
  .toolbar>a,.toolbar>button,.toolbar>.progress,.toolbar>span{flex:0 0 auto!important;white-space:nowrap!important;min-height:40px!important;display:inline-flex!important;align-items:center!important}
  .toolbar a,.toolbar button{padding:8px 10px!important}
  .toolbar input,#search{order:initial!important;flex:0 0 185px!important;min-width:185px!important;max-width:72vw!important;height:40px!important}
  .progress .bar,.toolbar .bar{width:64px!important}

  main>section,section.group,section.search-hub,.search-hub{padding:14px!important;margin:10px 0!important;border-radius:16px!important;scroll-margin-top:62px!important}
  .section-head{display:block!important;padding-bottom:10px!important;margin-bottom:12px!important}
  .section-head h2{font-size:20px!important;line-height:1.35!important}
  .section-head p{font-size:13px!important;line-height:1.65!important;margin-top:5px!important}
  .badge,.level{display:inline-flex!important;margin-top:8px!important;white-space:normal!important;line-height:1.35!important}

  .memory-grid,.knowledge-grid,.core-grid,.question-list,.oral-grid,.recall-list,.plan,.compare-grid,.quick-grid,.tier-grid,.cards,.catalog,.story-grid,.intro-grid,.intro-core,.six,.toc{grid-template-columns:minmax(0,1fr)!important;gap:9px!important}
  .memory,.knowledge,.core-card,.question,.oral-card,.oral,.day,.round,.compare,.compare-card,.quick-card,.tierbox,.card,.story-card{min-width:0!important;padding:13px!important;border-radius:14px!important}
  .memory h3,.knowledge h3,.card h2,.question h3,.oral-question{font-size:16px!important;line-height:1.55!important}
  .memory p,.knowledge p,.card p{margin:7px 0!important}
  .qhead,.qtop,.memory-head{align-items:flex-start!important}
  .qnum{flex:0 0 34px!important;width:34px!important;height:34px!important}
  .options{grid-template-columns:minmax(0,1fr)!important;gap:6px!important}
  .options li{padding:10px!important;line-height:1.55!important}
  .answer,.oral-skeleton,.skeleton,.formula,.logic,.bridge,.exam-use{padding:10px 11px!important;overflow-wrap:anywhere!important}
  .why-list{padding-left:20px!important}
  .why-list li{margin:6px 0!important}
  .reveal,.mastery,.attempt{min-height:40px!important}
  .recall-item summary{font-size:15px!important;line-height:1.5!important}
  .application-card{padding:13px!important}
  .notes-area,textarea{min-height:150px!important;font-size:16px!important}
  .flow-note{padding:13px;margin:11px 0;border-radius:15px}
  .flow-note-head{display:block}
  .flow-note-tag{display:inline-flex;margin-top:7px}
  .pre-quiz-area{min-height:132px!important}
  .post-quiz-note{display:block}
  .note-jumps{margin-top:11px}
  .note-jump{white-space:normal}
  .table-context-badge{margin:5px 5px 0 0;font-size:11px;white-space:normal}
  .chapter-page-range{margin:6px 0 0;white-space:normal}
  .learning-path{padding:13px;margin:10px 0 13px;border-radius:16px}
  .learning-path-head{display:block}
  .learning-path-progress{display:inline-flex;margin-top:7px}
  .learning-steps{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(210px,78vw);padding-bottom:5px;scroll-snap-type:x proximity}
  .learning-step{scroll-snap-align:start}
  .mood-diary{padding:12px;margin:12px 0 3px}
  .mood-diary-row{display:grid;grid-template-columns:auto 1fr;gap:7px}
  .mood-diary-input{grid-column:1/-1;width:100%;font-size:16px}
  .mood-diary-status{justify-self:end}
  .mood-quote{align-items:flex-start}

  .table-wrap{display:block!important;max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-inline:contain!important}
  table{font-size:13px!important}
  th,td{padding:9px 10px!important;line-height:1.55!important}
  .clinical-table{display:block!important;min-width:0!important;width:100%!important}
  .clinical-table thead{display:none!important}
  .clinical-table tbody{display:grid!important;gap:10px!important;padding:8px!important}
  .clinical-table tr{display:block!important;border:1px solid var(--line,#dfd5f2)!important;border-radius:13px!important;overflow:hidden!important;background:#fff!important}
  .clinical-table td{display:block!important;width:100%!important;min-width:0!important;white-space:normal!important;border-bottom:1px dashed #e7def5!important;padding:9px 11px!important}
  .clinical-table td:last-child{border-bottom:0!important}
  .clinical-table td:before{display:block!important;margin-bottom:2px!important;color:var(--muted,#6e6781)!important;font-size:11px!important;font-weight:900!important}
  .clinical-table td:nth-child(1):before{content:"类别"}
  .clinical-table td:nth-child(2):before{content:"项目"}
  .clinical-table td:nth-child(3):before{content:"作用或判定意义"}
  .clinical-table td:nth-child(4):before{content:"关键用法或数值"}
  .clinical-table td:nth-child(5):before{content:"主要风险或副作用"}
  .clinical-table td:nth-child(6):before{content:"护理监测与边界"}
  .clinical-table td:nth-child(7):before{content:"来源"}

  .group{padding:13px!important}
  .grouphead{align-items:flex-start!important;gap:8px!important}
  .grouphead h2{font-size:20px!important;line-height:1.4!important}
  footer{padding:16px 6px!important}
  .brandline{padding:10px!important;font-size:13px!important}
}

@media(max-width:390px){
  .hero h1{font-size:25px!important}
  .toolbar input,#search{flex-basis:165px!important;min-width:165px!important}
}
'''


STUDY_FLOW_JS = r'''(() => {
  const addChapterPageRange = () => {
    if (document.querySelector('.chapter-page-range')) return;
    const sections = [...document.querySelectorAll('section')];
    const section = sections.find(item => /核心知识卡/.test(item.querySelector('h2')?.textContent || ''));
    if (!section) return;
    const heading = section.querySelector('.section-head h2, h2');
    if (!heading) return;

    const parseRanges = text => {
      const found = [];
      const pattern = /教材\s*(?:第|P)?\s*(\d{1,4})\D{1,6}(\d{1,4})\s*页?/gi;
      let match;
      while ((match = pattern.exec(text || ''))) {
        const start = Number(match[1]);
        const end = Number(match[2]);
        if (start > 0 && end >= start && end - start < 500) found.push([start, end]);
      }
      return found;
    };
    const directTexts = [...document.querySelectorAll('#logic .badge, .hero p, .hero .badge')].map(item => item.textContent || '');
    const direct = directTexts.flatMap(parseRanges).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
    const counts = new Map();
    section.querySelectorAll('.source, .badge, small, p').forEach(item => {
      parseRanges(item.textContent || '').forEach(([start, end]) => {
        const key = `${start}-${end}`;
        const current = counts.get(key) || { start, end, count: 0 };
        current.count += 1;
        counts.set(key, current);
      });
    });
    const local = [...counts.values()].sort((a, b) => b.count - a.count || (b.end - b.start) - (a.end - a.start))[0];
    const chosen = direct || (local ? [local.start, local.end] : null);
    if (!chosen) return;
    const badge = document.createElement('small');
    badge.className = 'chapter-page-range';
    badge.textContent = `教材P${chosen[0]}—${chosen[1]}`;
    heading.appendChild(badge);
  };
  const cleanRepeatedTableColumns = () => {
    const compact = value => (value || '').replace(/\s+/g, ' ').trim();
    const sourceHeaders = new Set(['来源', '教材依据', '出处', '页码']);
    const removableHeaders = new Set(['使用边界', '护理监测与边界', '说明', '备注', '提示']);

    document.querySelectorAll('table').forEach(table => {
      if (table.dataset.compactChecked === 'true') return;
      table.dataset.compactChecked = 'true';
      const headers = [...table.querySelectorAll('thead th')];
      const rows = [...table.querySelectorAll('tbody tr')];
      if (!headers.length || rows.length < 2) return;

      for (let index = headers.length - 1; index >= 0; index -= 1) {
        const header = compact(headers[index].textContent);
        if (!sourceHeaders.has(header) && !removableHeaders.has(header)) continue;
        const cells = rows.map(row => row.cells[index]).filter(Boolean);
        if (cells.length !== rows.length) continue;
        const values = cells.map(cell => compact(cell.textContent));
        if (!values[0] || new Set(values).size !== 1) continue;

        if (sourceHeaders.has(header)) {
          const block = table.closest('article') || table.closest('section');
          const heading = block && block.querySelector('h3, h2');
          if (heading && !compact(heading.textContent).includes(values[0])) {
            const badge = document.createElement('small');
            badge.className = 'table-context-badge';
            badge.textContent = values[0];
            heading.appendChild(badge);
          }
        }
        headers[index].remove();
        cells.forEach(cell => cell.remove());
      }
    });
  };

  const buildLearningPath = pageKey => {
    if (document.getElementById('learning-path')) return;
    const main = document.querySelector('main') || document.querySelector('.wrap');
    if (!main) return;
    const pick = (...selectors) => selectors.map(selector => document.querySelector(selector)).find(Boolean);
    const read = pick('#read', '#logic');
    const handout = pick('#memory', '#knowledge', '#core', '#clinical-data', '#clues');
    const preNote = pick('#pre-quiz-note', '#notes');
    const practice = pick('#practice', '#original', '#exam');
    const review = pick('#post-quiz-note', '#plan');
    const recite = pick('#recitation', '#oral');
    const linkage = pick('#intro', '#notes');
    if (![read, handout, preNote, practice, review, recite, linkage].every(Boolean)) return;

    const targetTitle = target => {
      const heading = target.querySelector('.section-head h2, h2, h3');
      return heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
    };
    const steps = [
      ['对照书本', '先看教材原文范围，圈出对象、条件、数值和页码。', read],
      ['对照内部讲义', '补充老师强调、命题线索和容易混淆的区别。', handout],
      ['写极简笔记', '先凭记忆写5行，故意留下还不会的空白。', preNote],
      ['独立做题', '先判断再看解析，每题说出决定性线索。', practice],
      ['错题复盘', '只补遗漏线索、错因和需要修正的数值条件。', review],
      ['输出背诵', '脱稿说出鉴别、数值条件和完整判断链。', recite],
      ['联动迁移', document.getElementById('intro') ? '把本章放回患者故事和护理学导论中解释。' : '连接导论、其他疾病或临床情境，写进详细笔记。', linkage],
    ];
    const path = document.createElement('section');
    path.id = 'learning-path';
    path.className = 'learning-path';
    path.innerHTML = '<div class="learning-path-head"><div><h2>本章怎么学｜7步学习路径</h2><p>按顺序完成一次；复习时可直接从薄弱步骤进入。</p></div><span class="learning-path-progress" id="learningPathProgress">0/7 已完成</span></div><ol class="learning-steps"></ol>';
    const list = path.querySelector('.learning-steps');
    steps.forEach((step, index) => {
      const [label, action, target] = step;
      const item = document.createElement('li');
      item.className = 'learning-step';
      item.dataset.step = String(index + 1);
      const link = document.createElement('a');
      link.className = 'step-link';
      link.href = `#${target.id}`;
      const number = document.createElement('span');
      number.className = 'step-number';
      number.textContent = String(index + 1);
      const title = document.createElement('b');
      title.textContent = label;
      const detail = document.createElement('span');
      detail.textContent = action;
      const mapped = document.createElement('small');
      mapped.textContent = `对应：${targetTitle(target) || label}`;
      link.append(number, title, detail, mapped);
      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'step-check';
      check.textContent = '○ 标记完成';
      check.setAttribute('aria-pressed', 'false');
      item.append(link, check);
      list.appendChild(item);
    });
    main.insertBefore(path, main.firstElementChild);

    const storageKey = `${pageKey}-learning-path`;
    let progress = {};
    try { progress = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
    const updatePath = () => {
      let completed = 0;
      path.querySelectorAll('.learning-step').forEach(item => {
        const done = Boolean(progress[item.dataset.step]);
        item.classList.toggle('done', done);
        const button = item.querySelector('.step-check');
        button.textContent = done ? '✓ 已完成' : '○ 标记完成';
        button.setAttribute('aria-pressed', done ? 'true' : 'false');
        if (done) completed += 1;
      });
      path.querySelector('#learningPathProgress').textContent = `${completed}/7 已完成`;
    };
    path.querySelectorAll('.step-check').forEach(button => button.addEventListener('click', () => {
      const step = button.closest('.learning-step').dataset.step;
      progress[step] = !progress[step];
      try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch (_) {}
      updatePath();
    }));
    updatePath();
  };

  const buildMoodDiary = () => {
    if (document.getElementById('mood-diary')) return;
    const main = document.querySelector('main') || document.querySelector('.wrap');
    if (!main) return;
    const encouragements = [
      '按自己的节奏完成今天的任务，每一点积累都在靠近未来。',
      '学习不用一下拼尽全力，但今天不要缺席。',
      '累了可以休息一会儿，调整好再继续往前。',
      '今天背过的每个知识点，都会变成考场上的底气。',
      '认真对待每一道题，时间会回答你的努力。',
      '先把今天过好，专注当下这一页就够了。',
      '每天完成一个小目标，日积月累就是大进步。',
      '吃好睡好再认真学习，稳定也是一种能力。',
      '暂时看不到进步也没关系，沉淀正在发生。',
      '不拖延，不内耗，先完成眼前这一项。',
      '哪怕只进步一点点，也比停在原地更接近目标。',
      '别和别人比进度，今天比昨天多会一点就很好。',
      '学习很苦，坚持很酷，今天也别辜负自己。',
      '不用逼自己完美，把计划落实就是最快的路。',
      '结果不会陪敷衍演戏，你的认真会留下痕迹。',
      '你比想象中更坚强，困了休息，醒了继续。',
      '少一点胡思乱想，多一点脚踏实地。',
      '每一天的坚持，都在为上岸铺一小段路。',
      '认真背书、仔细做题、及时复盘，质变会慢慢出现。',
      '现在的每一分付出，都在悄悄积攒未来的底气。',
      '学习是细水长流，今天稳稳完成计划就好。',
      '再坚持一下，你每多会一点就离梦想更近一点。',
      '压力来时别逃避，把它拆成一道题、一个考点。',
      '放下焦虑，背该背的书，做该做的题。',
      '努力未必立刻见效，但坚持会让答案越来越清楚。',
      '自律比鸡汤更有用，今天按时完成任务。',
      '你不是一个人在战斗，难了就问，累了就歇。',
      '别着急，慢慢来，把知识真正学进去。',
      '每个认真刷题的日子，都在塑造更好的你。',
      '坚持到这里已经很棒，继续守住自己的节奏。',
      '把焦虑换成行动，做起来，迷雾就会散开。',
      '别怕走得慢，只要方向正确，每一步都算数。',
      '把努力当作复利，每天多会一点，时间会放大它。',
      '想都是问题，做才有答案，先写下第一步。',
      '今日种下的知识，也许晚些开花，但不会白费。',
      '心态稳、脚步稳、学习稳，你会走到想去的地方。',
      '那些不起眼的日复一日，会让你看见坚持的意义。',
      '你读过的字句也许会模糊，却一直在塑造你的判断。',
      '把自己当成作品，今天只认真打磨一个细节。',
      '愿你合上书时，比翻开它时更笃定一点。'
    ];
    const shuffle = values => {
      const result = [...values];
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };
    const bagKey = 'nursing-encouragement-bag-v1';
    const nextQuote = () => {
      let state = { remaining: [], last: -1 };
      try { state = JSON.parse(localStorage.getItem(bagKey) || JSON.stringify(state)); } catch (_) {}
      const valid = Array.isArray(state.remaining) && state.remaining.every(index => Number.isInteger(index) && index >= 0 && index < encouragements.length);
      if (!valid || !state.remaining.length) {
        state.remaining = shuffle(encouragements.map((_, index) => index));
        if (state.remaining.length > 1 && state.remaining[state.remaining.length - 1] === state.last) {
          [state.remaining[0], state.remaining[state.remaining.length - 1]] = [state.remaining[state.remaining.length - 1], state.remaining[0]];
        }
      }
      const index = state.remaining.pop();
      state.last = index;
      try { localStorage.setItem(bagKey, JSON.stringify(state)); } catch (_) {}
      return encouragements[index];
    };
    const now = new Date();
    const dateKey = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(value => String(value).padStart(2, '0')).join('-');
    const diaryKey = `nursing-mood-diary-${dateKey}`;
    const diary = document.createElement('section');
    diary.id = 'mood-diary';
    diary.className = 'mood-diary';
    diary.innerHTML = `
      <div class="mood-diary-row">
        <label class="mood-diary-title" for="moodDiaryInput">今日心情日记</label>
        <input class="mood-diary-input" id="moodDiaryInput" maxlength="80" placeholder="写下一句今天的心情或完成的小事……">
        <span class="mood-diary-status" id="moodDiaryStatus">本机保存</span>
      </div>
      <div class="mood-quote"><span aria-hidden="true">✦</span><span class="mood-quote-text"></span><button class="mood-refresh" type="button">换一句</button></div>`;
    const footer = main.querySelector('footer');
    main.insertBefore(diary, footer || null);
    const input = diary.querySelector('#moodDiaryInput');
    const status = diary.querySelector('#moodDiaryStatus');
    const quote = diary.querySelector('.mood-quote-text');
    try { input.value = localStorage.getItem(diaryKey) || ''; } catch (_) {}
    quote.textContent = nextQuote();
    let timer;
    input.addEventListener('input', () => {
      try { localStorage.setItem(diaryKey, input.value); } catch (_) {}
      status.textContent = '已保存';
      clearTimeout(timer);
      timer = setTimeout(() => status.textContent = '本机保存', 1400);
    });
    diary.querySelector('.mood-refresh').addEventListener('click', () => { quote.textContent = nextQuote(); });
  };

  const run = () => {
    addChapterPageRange();
    cleanRepeatedTableColumns();
    const practice = document.getElementById('practice') || document.getElementById('original') || document.getElementById('exam');
    const notes = document.getElementById('notes');
    if (!practice) return;
    buildMoodDiary();

    const pageKey = document.body.dataset.key || location.pathname;
    if (document.getElementById('pre-quiz-note')) {
      buildLearningPath(pageKey);
      buildMoodDiary();
      return;
    }
    const storageKey = `${pageKey}-pre-quiz-note`;
    const pre = document.createElement('section');
    pre.id = 'pre-quiz-note';
    pre.className = 'flow-note pre-quiz-note';
    pre.innerHTML = `
      <div class="flow-note-head">
        <div>
          <h2>做题前｜先写5行极简笔记</h2>
          <p>只写：主题或疾病、决定性线索、关键数值或条件、护理优先级、最易混点。不求完整，先暴露自己真正记住了什么。</p>
        </div>
        <span class="flow-note-tag">答题前 2—3 分钟</span>
      </div>
      <textarea class="pre-quiz-area" id="preQuizNotes" rows="5" aria-label="做题前极简笔记" placeholder="1. 主题/疾病：\n2. 决定性线索：\n3. 关键数值或条件：\n4. 护理优先级：\n5. 最易混点："></textarea>
      <div class="flow-note-status" id="preQuizNoteStatus">内容保存在当前设备</div>`;
    practice.parentNode.insertBefore(pre, practice);

    const area = pre.querySelector('#preQuizNotes');
    const status = pre.querySelector('#preQuizNoteStatus');
    try { area.value = localStorage.getItem(storageKey) || ''; } catch (_) {}
    let timer;
    area.addEventListener('input', () => {
      try { localStorage.setItem(storageKey, area.value); } catch (_) {}
      status.textContent = '已自动保存';
      clearTimeout(timer);
      timer = setTimeout(() => status.textContent = '内容保存在当前设备', 1400);
    });

    const post = document.createElement('aside');
    post.className = 'flow-note post-quiz-note';
    post.id = 'post-quiz-note';
    post.innerHTML = `
      <div>
        <h3>做题后｜只补暴露出来的缺口</h3>
        <p>补上漏掉的鉴别线索、错因和关键数值/条件；已经会的内容不再抄一遍。</p>
      </div>
      <div class="note-jumps">
        <a class="note-jump" href="#pre-quiz-note">回到原笔记修改</a>
        ${notes ? '<a class="note-jump" href="#notes">去章节详细笔记</a>' : ''}
      </div>`;
    const truth = document.getElementById('truth');
    const anchor = truth || practice;
    anchor.insertAdjacentElement('afterend', post);

    if (notes) {
      const heading = notes.querySelector('h2');
      if (heading) {
        const prefix = heading.textContent.match(/^\s*(\d+[A-Z]?\s*[｜|]\s*)/);
        heading.textContent = `${prefix ? prefix[1] : ''}章节补充笔记｜详细整理`;
      }
      const paragraph = notes.querySelector('.section-head p') || notes.querySelector('p');
      if (paragraph) paragraph.textContent = '收纳老师强调、错题归因、跨章节联系和需要长期保留的内容；先回看做题前笔记，只补新增认识。';
    }
    buildLearningPath(pageKey);
    buildMoodDiary();
  };
  run();
})();
'''


def inject(root: Path) -> tuple[int, int]:
    root = root.resolve()
    css_path = root / "mobile-comfort.css"
    js_path = root / "study-flow.js"
    css_path.write_text(MOBILE_CSS, encoding="utf-8")
    js_path.write_text(STUDY_FLOW_JS, encoding="utf-8")
    changed = 0
    total = 0
    for path in root.rglob("*.html"):
        relative = path.relative_to(root)
        if relative.parts and relative.parts[0].lower() == "outputs":
            continue
        total += 1
        text = path.read_text(encoding="utf-8")
        text = text.replace("头狗菌素", "头孢菌素")
        if "mobile-comfort.css" not in text:
            href = Path(os.path.relpath(css_path, path.parent)).as_posix()
            marker = f'<link rel="stylesheet" href="{href}">'
            if "</head>" not in text:
                raise ValueError(f"Missing </head>: {path}")
            text = text.replace("</head>", marker + "</head>", 1)
        if "study-flow.js" not in text:
            src = Path(os.path.relpath(js_path, path.parent)).as_posix()
            marker = f'<script src="{src}"></script>'
            if "</body>" not in text:
                raise ValueError(f"Missing </body>: {path}")
            text = text.replace("</body>", marker + "</body>", 1)
        original = path.read_text(encoding="utf-8")
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
    search_index = root / "search-index"
    if search_index.exists():
        for path in search_index.glob("*.json"):
            original = path.read_text(encoding="utf-8")
            corrected = original.replace("头狗菌素", "头孢菌素")
            if corrected != original:
                path.write_text(corrected, encoding="utf-8")
    return total, changed


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("outputs/nursing-study-site")
    total, changed = inject(target)
    print(f"mobile stylesheet and study flow linked: {total} pages; changed: {changed}; root: {target.resolve()}")

