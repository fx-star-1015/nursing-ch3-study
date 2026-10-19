from __future__ import annotations

import base64
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent / "outputs" / "nursing-study-site"


class VisibleTextParser(HTMLParser):
    SKIP_TAGS = {"script", "style", "nav", "footer", "svg"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.parts: list[str] = []
        self.title_parts: list[str] = []
        self.h1_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS:
            self.skip_depth += 1
        if tag == "h1" and not self.skip_depth:
            self.h1_depth += 1

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "h1" and self.h1_depth:
            self.h1_depth -= 1
        if tag in self.SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        value = re.sub(r"\s+", " ", data).strip()
        if not value:
            return
        self.parts.append(value)
        if self.h1_depth:
            self.title_parts.append(value)


def content_files() -> list[tuple[str, Path]]:
    result: list[tuple[str, Path]] = []
    result.extend(("内科护理学", p) for p in sorted((ROOT / "medical").glob("*/section-*.html")))
    result.extend(("外科护理学", p) for p in sorted((ROOT / "surgical").glob("ch*.html")))
    result.extend(
        ("基础护理学", p)
        for p in sorted((ROOT / "fundamentals").glob("ch*.html"))
        if p.name != "ch03-hospital-environment.html"
    )
    result.extend(("护理学导论", p) for p in sorted((ROOT / "introduction").glob("ch*.html")))
    return result


def build_index() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for book, path in content_files():
        parser = VisibleTextParser()
        parser.feed(path.read_text(encoding="utf-8"))
        text = " ".join(parser.parts)
        text = re.sub(r"\s+", " ", html.unescape(text)).strip()
        title = " ".join(parser.title_parts).strip()
        if not title:
            match = re.search(r"<title>(.*?)</title>", path.read_text(encoding="utf-8"), re.I | re.S)
            title = re.sub(r"\s+", " ", html.unescape(match.group(1))).strip() if match else path.stem
        entries.append(
            {
                "book": book,
                "title": title,
                "url": path.relative_to(ROOT).as_posix(),
                "text": text,
            }
        )
    return entries


SEARCH_JS = r'''(() => {
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
'''


PET_JS = r'''(() => {
  if (document.querySelector('.study-pet')) return;
  const petImage = '__PET_IMAGE_URL__';
  const lines = [
    '今天不求看得快，只求真正会一道。',
    '先抓决定性线索，再看选项挖了什么坑。',
    '我都发芽了，你这页还没翻？',
    '错题不是黑历史，是下一次的送分题。',
    '别和题干吵架，先把判断依据说出来。',
    '喝口水，回来把这张卡拿下。',
    '又想只看答案？先自己说一遍理由。',
    '记不住很正常，第二轮就是来抓漏网之鱼的。',
    '今天会的这一点，考试时就可能多拿一分。',
    '先做三题，再奖励自己摸鱼五分钟。',
    '知识点不怕多，怕的是没有放进逻辑链。',
    '这个数值别裸背：对象、条件、单位一起记。',
    '别急着翻解析，我再给你十秒钟。',
    '你负责认真，我负责在旁边长叶子。',
    '难题先拆：病人是谁、发生了什么、现在先做什么？',
    '学累了可以歇，回来时从最小的一步开始。'
  ];
  const style = document.createElement('style');
  style.textContent = `
    .study-pet{position:fixed!important;right:18px!important;top:18px!important;bottom:auto!important;left:auto!important;z-index:9999;display:flex;align-items:flex-start;gap:6px;filter:drop-shadow(0 10px 14px #4c357028)}
    .study-pet-character{width:112px;height:112px;border:0;padding:0;background:transparent;cursor:pointer;transform-origin:50% 100%;animation:pet-bob 3.6s ease-in-out infinite;image-rendering:pixelated}
    .study-pet-character img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
    .study-pet-bubble{position:relative;max-width:244px;margin-top:28px;padding:11px 32px 11px 13px;border:1px solid #d9cdf1;border-radius:15px 4px 15px 15px;background:#fff;color:#302742;box-shadow:0 10px 28px #60479322;font-size:14px;line-height:1.55;animation:bubble-in .28s ease-out}
    .study-pet-bubble::after{content:'';position:absolute;right:-8px;top:12px;width:15px;height:15px;background:#fff;border-right:1px solid #d9cdf1;border-bottom:1px solid #d9cdf1;transform:rotate(-45deg)}
    .study-pet-close{position:absolute;top:3px;right:5px;width:25px;height:25px;border:0;background:transparent;color:#8a7b9c;font-size:18px;cursor:pointer}
    .study-pet-hint{position:absolute;right:15px;top:105px;padding:2px 7px;border-radius:99px;background:#fff;color:#7151b7;font-size:10px;font-weight:800;opacity:0;transition:.2s;pointer-events:none}
    .study-pet:hover .study-pet-hint{opacity:1;transform:translateY(-2px)}
    @keyframes pet-bob{0%,100%{transform:translateY(0) rotate(-1deg)}45%{transform:translateY(-7px) rotate(1deg)}52%{transform:translateY(-7px) rotate(1deg) scaleY(.97)}58%{transform:translateY(-7px) rotate(1deg) scaleY(1)}}
    @keyframes bubble-in{from{opacity:0;transform:translateY(7px) scale(.96)}to{opacity:1;transform:none}}
    @media(max-width:680px){.study-pet{right:8px!important;top:8px!important;bottom:auto!important}.study-pet-character{width:82px;height:82px}.study-pet-bubble{max-width:min(220px,calc(100vw - 112px));margin-top:18px;padding:9px 29px 9px 11px;font-size:12px}.study-pet-hint{top:76px}}
    @media(prefers-reduced-motion:reduce){.study-pet-character,.study-pet-bubble{animation:none}}
  `;
  document.head.appendChild(style);
  const pet = document.createElement('aside');
  pet.className = 'study-pet';
  pet.setAttribute('aria-label', '学习陪伴宠物');
  pet.innerHTML = `<div class="study-pet-bubble"><span></span><button class="study-pet-close" aria-label="暂时收起宠物提示">×</button></div><button class="study-pet-character" aria-label="让学习宠物换一句话"><img src="${petImage}" alt="紫色像素学习宠物"></button><small class="study-pet-hint">点我换一句</small>`;
  document.body.appendChild(pet);
  const compact = window.matchMedia('(max-width:680px)').matches;
  Object.assign(pet.style, {
    position: 'fixed',
    right: compact ? '8px' : '18px',
    top: compact ? '8px' : '18px',
    bottom: 'auto',
    left: 'auto',
    zIndex: '9999'
  });
  const bubble = pet.querySelector('.study-pet-bubble');
  const text = bubble.querySelector('span');
  let last = -1;
  const speak = () => {
    let next;
    do next = Math.floor(Math.random() * lines.length); while (next === last && lines.length > 1);
    last = next;
    text.textContent = lines[next];
    bubble.hidden = false;
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';
  };
  pet.querySelector('.study-pet-character').addEventListener('click', speak);
  pet.querySelector('.study-pet-close').addEventListener('click', event => {
    event.stopPropagation();
    bubble.hidden = true;
  });
  speak();
})();
'''


def inline_pet_js() -> str:
    image = base64.b64encode((ROOT / "assets" / "study-pet-v1.png").read_bytes()).decode("ascii")
    return PET_JS.replace("__PET_IMAGE_URL__", f"data:image/png;base64,{image}")


def ensure_script_and_input(path: Path, *, root: str) -> None:
    source = path.read_text(encoding="utf-8")
    if "data-full-book-search" not in source:
        source, changed = re.subn(
            r'<input\s+id="(?:catalogSearch|chapterSearch|find)"([^>]*)>',
            lambda m: (
                '<input data-full-book-search data-search-root="../" '
                'data-index-path="../search-index/manifest.json" id="fullBookSearch"'
                + re.sub(r'\s+placeholder="[^"]*"', '', m.group(1))
                + ' placeholder="搜索四本书中的疾病、理论、药物、数值或考点……">'
            ),
            source,
            count=1,
        )
        if not changed:
            raise RuntimeError(f"Cannot find search input in {path}")
    source = source.replace('../search-index.json', '../search-index/manifest.json')
    source = re.sub(
        r'<script>[^<]*(?:catalogSearch|chapterSearch|getElementById\(\'find\'\))[^<]*</script>',
        '',
        source,
    )
    if "full-book-search.js" not in source:
        source = source.replace("</body>", f'<script src="{root}full-book-search.js"></script></body>')
    source = re.sub(r'<script src="[^"]*study-pet\.js"></script>', '', source)
    pet_tag = f'<script data-study-pet>{inline_pet_js()}</script>'
    if "data-study-pet" in source:
        source = re.sub(r'<script data-study-pet>.*?</script>', pet_tag, source, count=1, flags=re.S)
    else:
        source = source.replace("</body>", f'{pet_tag}</body>')
    path.write_text(source, encoding="utf-8")


def update_root_index() -> None:
    path = ROOT / "index.html"
    source = path.read_text(encoding="utf-8")
    if "data-full-book-search" not in source:
        search_section = (
            '<section class="search-hub"><h2>全书搜索</h2>'
            '<p>以内科、外科、基础护理学和护理学导论全部学习章节为库，搜索疾病、理论、症状、药物、数值或考点。</p>'
            '<input data-full-book-search data-search-root="./" data-index-path="search-index/manifest.json" '
            'id="fullBookSearch" placeholder="搜索四本书中的疾病、理论、药物、数值或考点……"></section>'
        )
        source = source.replace("</nav>", f"</nav>{search_section}", 1)
    source = source.replace('data-index-path="search-index.json"', 'data-index-path="search-index/manifest.json"')
    source = source.replace("9个系统、110个独立学习章节", "9个系统、87个独立学习章节")
    if "full-book-search.js" not in source:
        source = source.replace("</body>", '<script src="full-book-search.js"></script></body>')
    source = re.sub(r'<script src="[^"]*study-pet\.js"></script>', '', source)
    pet_tag = f'<script data-study-pet>{inline_pet_js()}</script>'
    if "data-study-pet" in source:
        source = re.sub(r'<script data-study-pet>.*?</script>', pet_tag, source, count=1, flags=re.S)
    else:
        source = source.replace("</body>", f'{pet_tag}</body>')
    path.write_text(source, encoding="utf-8")


def main() -> None:
    entries = build_index()
    search_dir = ROOT / "search-index"
    search_dir.mkdir(exist_ok=True)
    for old in search_dir.glob("chunk-*.json"):
        old.unlink()
    chunks: list[list[dict[str, str]]] = []
    current: list[dict[str, str]] = []
    current_size = 2
    for entry in entries:
        encoded = json.dumps(entry, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        if current and current_size + len(encoded) + 1 > 240_000:
            chunks.append(current)
            current, current_size = [], 2
        current.append(entry)
        current_size += len(encoded) + 1
    if current:
        chunks.append(current)
    chunk_names = []
    for number, chunk in enumerate(chunks, 1):
        name = f"chunk-{number:03d}.json"
        chunk_names.append(name)
        (search_dir / name).write_text(
            json.dumps(chunk, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    (search_dir / "manifest.json").write_text(
        json.dumps({"count": len(entries), "chunks": chunk_names}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    old_monolith = ROOT / "search-index.json"
    if old_monolith.exists():
        old_monolith.unlink()
    (ROOT / "full-book-search.js").write_text(SEARCH_JS.strip() + "\n", encoding="utf-8")
    external_pet = PET_JS.replace(
        "'__PET_IMAGE_URL__'",
        "new URL('assets/study-pet-v1.png', document.currentScript.src).href",
    )
    (ROOT / "study-pet.js").write_text(external_pet.strip() + "\n", encoding="utf-8")
    update_root_index()
    for name in ("medical", "surgical", "fundamentals", "introduction"):
        ensure_script_and_input(ROOT / name / "index.html", root="../")
    print(f"indexed {len(entries)} chapters")
    counts: dict[str, int] = {}
    for entry in entries:
        counts[entry["book"]] = counts.get(entry["book"], 0) + 1
    print(counts)


if __name__ == "__main__":
    main()
