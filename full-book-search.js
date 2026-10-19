(() => {
  const input = document.querySelector('[data-full-book-search]');
  if (!input) return;
  input.oninput = null;
  const root = input.dataset.searchRoot || './';
  const indexPath = input.dataset.indexPath || `${root}search-index/manifest.json`;
  const base = new URL(root, document.baseURI);
  const panel = document.createElement('section');
  panel.className = 'full-search-results';
  panel.hidden = true;
  input.insertAdjacentElement('afterend', panel);

  if (!document.getElementById('full-book-search-style')) {
    const style = document.createElement('style');
    style.id = 'full-book-search-style';
    style.textContent = `
      [data-full-book-search]{width:100%;min-height:50px;padding:13px 16px;border:2px solid #2b2540;border-radius:15px;background:#fff;color:#2b2540;font:inherit;font-size:16px;outline:none}
      [data-full-book-search]:focus{border-color:#7151b7;box-shadow:0 0 0 4px #7151b722}
      .full-search-results{width:100%;margin-top:10px;padding:10px;background:#fff;border:1px solid #ded4f2;border-radius:16px;box-shadow:0 16px 34px #6047931f;max-height:min(68vh,650px);overflow:auto;position:relative;z-index:20}
      .full-search-summary{padding:8px 9px 11px;color:#716982;font-size:13px}
      .full-search-item{display:block;padding:13px 14px;border-radius:12px;color:#2b2540;text-decoration:none;border-top:1px solid #eee7fa}
      .full-search-item:first-of-type{border-top:0}.full-search-item:hover{background:#f7f3ff}
      .full-search-book{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:99px;background:#eee6ff;color:#6040a7;font-size:12px;font-weight:800}
      .full-search-title{font-weight:900}.full-search-snippet{display:block;margin-top:5px;color:#625a73;line-height:1.65;font-size:14px}
      .full-search-snippet mark{background:#ffe8a8;color:#322659;border-radius:3px;padding:0 2px}
      .full-search-empty{padding:20px 12px;text-align:center;color:#716982}
      .search-hub{background:#fff;border:1px solid #ded4f2;border-radius:22px;padding:18px;margin:16px 0;box-shadow:0 12px 32px #60479312}
      .search-hub h2{margin:0 0 4px}.search-hub p{margin:0 0 12px;color:#716982}
      @media(max-width:680px){.full-search-results{max-height:64vh}.full-search-item{padding:12px 9px}}
    `;
    document.head.appendChild(style);
  }

  let recordsPromise;
  const loadRecords = () => recordsPromise ||= fetch(indexPath).then(r => {
    if (!r.ok) throw new Error(`索引加载失败：${r.status}`);
    return r.json();
  }).then(manifest => {
    if (Array.isArray(manifest)) return manifest;
    const manifestUrl = new URL(indexPath, document.baseURI);
    return Promise.all(manifest.chunks.map(name => fetch(new URL(name, manifestUrl)).then(r => {
      if (!r.ok) throw new Error(`索引分片加载失败：${r.status}`);
      return r.json();
    }))).then(parts => parts.flat());
  });
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const compact = value => value.toLocaleLowerCase('zh-CN').replace(/\s+/g, '');
  const snippet = (text, query) => {
    const lower = text.toLocaleLowerCase('zh-CN');
    const q = query.toLocaleLowerCase('zh-CN');
    let at = lower.indexOf(q);
    if (at < 0) at = Math.max(0, lower.search(new RegExp(q.split(/\s+/).filter(Boolean).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')));
    const start = Math.max(0, at - 54);
    const end = Math.min(text.length, at + q.length + 105);
    let shown = text.slice(start, end);
    const hitAt = shown.toLocaleLowerCase('zh-CN').indexOf(q);
    if (hitAt >= 0) shown = `${esc(shown.slice(0, hitAt))}<mark>${esc(shown.slice(hitAt, hitAt + q.length))}</mark>${esc(shown.slice(hitAt + q.length))}`;
    else shown = esc(shown);
    return `${start ? '…' : ''}${shown}${end < text.length ? '…' : ''}`;
  };
  const search = (records, raw) => {
    const query = raw.trim();
    const needle = compact(query);
    const terms = query.toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean);
    return records.map(item => {
      const title = compact(item.title);
      const book = compact(item.book);
      const body = compact(item.text);
      if (!terms.every(t => compact(`${item.book} ${item.title} ${item.text}`).includes(compact(t)))) return null;
      const titleAt = title.indexOf(needle);
      const bodyAt = body.indexOf(needle);
      let score = titleAt >= 0 ? 240 - Math.min(titleAt, 80) : 0;
      if (book.includes(needle)) score += 70;
      if (bodyAt >= 0) score += 80 - Math.min(bodyAt / 500, 40);
      for (const term of terms) {
        if (title.includes(compact(term))) score += 35;
        const count = body.split(compact(term)).length - 1;
        score += Math.min(count, 8) * 4;
      }
      return {...item, score};
    }).filter(Boolean).sort((a,b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-CN')).slice(0, 30);
  };
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const query = input.value.trim();
    if (!query) { panel.hidden = true; panel.innerHTML = ''; return; }
    panel.hidden = false;
    panel.innerHTML = '<div class="full-search-summary">正在检索四本书全文……</div>';
    timer = setTimeout(async () => {
      try {
        const records = await loadRecords();
        const hits = search(records, query);
        if (!hits.length) {
          panel.innerHTML = `<div class="full-search-empty">没有找到“${esc(query)}”。可以换用疾病名、药名、症状、数值或理论名称。</div>`;
          return;
        }
        panel.innerHTML = `<div class="full-search-summary">在 ${records.length} 个章节中找到 ${hits.length}${hits.length === 30 ? '+' : ''} 个结果</div>` + hits.map(item => `
          <a class="full-search-item" href="${new URL(item.url, base).href}">
            <span class="full-search-book">${esc(item.book)}</span><span class="full-search-title">${esc(item.title)}</span>
            <span class="full-search-snippet">${snippet(item.text, query)}</span>
          </a>`).join('');
      } catch (error) {
        panel.innerHTML = '<div class="full-search-empty">搜索索引暂时没有加载成功，请刷新页面后再试。</div>';
      }
    }, 100);
  });
  document.addEventListener('click', e => {
    if (e.target !== input && !panel.contains(e.target)) panel.hidden = true;
  });
})();

