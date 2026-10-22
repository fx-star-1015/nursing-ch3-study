(() => {
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

