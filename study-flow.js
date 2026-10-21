(() => {
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

  const run = () => {
    cleanRepeatedTableColumns();
    const practice = document.getElementById('practice');
    const notes = document.getElementById('notes');
    if (!practice || document.getElementById('pre-quiz-note')) return;

    const pageKey = document.body.dataset.key || location.pathname;
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
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

