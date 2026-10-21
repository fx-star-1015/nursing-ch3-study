from __future__ import annotations

import os
import sys
from pathlib import Path


MOBILE_CSS = r'''/* Shared mobile reading layer for every study page. */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;overflow-wrap:anywhere}
body{overflow-x:hidden}
img,svg,video,canvas{max-width:100%;height:auto}
button,a,input,textarea,select{touch-action:manipulation}

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


def inject(root: Path) -> tuple[int, int]:
    root = root.resolve()
    css_path = root / "mobile-comfort.css"
    css_path.write_text(MOBILE_CSS, encoding="utf-8")
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
    print(f"mobile stylesheet linked: {total} pages; changed: {changed}; root: {target.resolve()}")

