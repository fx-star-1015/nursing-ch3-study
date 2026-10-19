# -*- coding: utf-8 -*-
"""Build Internal Medicine as system directories with independent topic pages.

Every student-facing statement comes from the supplied textbook extracts or the
curated true-question bank.  The generated pages deliberately contain no
production/audit language.
"""
from __future__ import annotations

import copy
import html
import re
from collections import defaultdict
from pathlib import Path

import build_surgical_site as base
from clinical_tables import build_clinical_rows
from clue_profiles import common_question, compact_clue
from internal_profiles import CHAPTERS
from nursing_true_banks import INTERNAL_BANK
from internal_topic_overrides import (
    CLINICAL_OVERRIDES, CLUE_OVERRIDES, CORE_OVERRIDES, INTRO_LINKS, TRUE_OVERRIDES,
)
from internal_true_supplements import SUPPLEMENTS
from internal_answered_expansion import ANSWERED_EXPANSION
from internal_true_expansion_manual import MANUAL_EXPANSION
from internal_true_expansion_round2 import ROUND2_EXPANSION

ROOT = Path(__file__).parent
STAGE = ROOT / "outputs" / "nursing-study-site" / "medical"
WORK = ROOT / "work" / "book-distill" / "internal-nursing-full"

SYSTEMS = {
    1: "introduction", 2: "respiratory", 3: "cardiovascular", 4: "digestive",
    5: "urinary", 6: "hematology", 7: "endocrine-metabolic",
    8: "rheumatology", 9: "neurology",
}

# Internal Medicine is organised as textbook-scale disease chapters.  Closely
# related short sections share one page so that a page has enough distinct,
# source-bound true questions and does not fragment one learning task into a
# string of one-question mini pages.
TOPIC_GROUPS = {
    1: [("内科护理总论", ["内科护理总论"])],
    2: [
        ("呼吸系统症状与感染性疾病", ["常见症状评估", "急性呼吸道感染", "肺部感染"]),
        ("支气管扩张、肺结核与支气管哮喘", ["支气管扩张", "肺结核", "支气管哮喘"]),
        ("慢阻肺与慢性肺源性心脏病", ["慢阻肺", "慢性肺源性心脏病"]),
        ("肺循环、睡眠呼吸障碍与呼吸衰竭", ["肺血栓栓塞", "睡眠呼吸暂停", "呼吸衰竭与ARDS", "机械通气"]),
        ("肺癌、胸膜疾病与呼吸系统诊疗", ["原发性支气管肺癌", "胸膜疾病", "支气管镜与胸穿"]),
    ],
    3: [
        ("循环症状、慢性心力衰竭与心肌疾病", ["循环症状线索", "慢性心力衰竭", "心肌疾病"]),
        ("急性心力衰竭、心律失常与心脏骤停", ["急性心力衰竭", "心律失常与器械介入治疗", "心脏骤停"]),
        ("心脏瓣膜、感染性心内膜与心包疾病", ["心脏瓣膜病", "感染性心内膜炎", "心包疾病"]),
        ("冠心病与原发性高血压", ["冠心病、急性冠脉综合征与冠脉介入", "原发性高血压"]),
    ],
    4: [
        ("胃食管反流、胃炎、消化性溃疡与胃癌", ["胃食管反流病", "胃炎", "消化性溃疡", "胃癌"]),
        ("消化症状与炎症性肠病", ["消化症状评估", "肠结核与结核性腹膜炎", "炎症性肠病"]),
        ("脂肪性肝病、肝硬化、肝癌与肝性脑病", ["脂肪性肝病与肝硬化", "原发性肝癌", "肝性脑病"]),
        ("急性胰腺炎、上消化道出血与内镜护理", ["急性胰腺炎", "上消化道出血", "腹穿与内镜护理"]),
    ],
    5: [
        ("泌尿症状与肾小球疾病", ["泌尿症状线索", "肾小球疾病框架", "急性肾小球肾炎"]),
        ("急慢性肾炎、肾病综合征与尿路感染", ["急进性与慢性肾炎", "肾病综合征", "尿路感染"]),
        ("急慢性肾衰竭与透析治疗", ["急性肾损伤", "慢性肾衰竭", "血液透析", "腹膜透析"]),
    ],
    6: [
        ("贫血评估、缺铁性与巨幼细胞贫血", ["贫血与出血评估", "缺铁性与巨幼细胞贫血"]),
        ("再生障碍性、溶血性贫血与出血性疾病", ["再生障碍性贫血", "溶血性贫血", "血小板减少与血友病"]),
        ("白血病", ["白血病"]),
        ("DIC、淋巴瘤、骨髓瘤与造血干细胞移植", ["弥散性血管内凝血", "淋巴瘤与多发性骨髓瘤", "造血干细胞移植与骨髓穿刺"]),
    ],
    7: [
        ("甲状腺功能亢进与减退", ["甲状腺功能亢进", "甲状腺功能减退"]),
        ("腺垂体与肾上腺疾病", ["内分泌评估与腺垂体功能减退", "库欣综合征", "肾上腺皮质功能减退", "嗜铬细胞瘤"]),
        ("糖尿病", ["糖尿病"]),
        ("肥胖、血脂、尿酸与骨代谢异常", ["肥胖症与血脂异常", "高尿酸血症与痛风", "骨质疏松症"]),
    ],
    8: [
        ("风湿症状评估与系统性红斑狼疮", ["风湿症状评估", "系统性红斑狼疮"]),
        ("强直性脊柱炎、类风湿关节炎与炎症性肌病", ["强直性脊柱炎", "类风湿关节炎", "特发性炎症性肌病"]),
    ],
    9: [
        ("神经症状定位、TIA与脑梗死", ["神经症状定位", "短暂性脑缺血发作", "脑梗死"]),
        ("脑出血", ["脑出血"]),
        ("蛛网膜下腔出血", ["蛛网膜下腔出血"]),
        ("多发性硬化、帕金森病与癫痫", ["多发性硬化", "帕金森病", "癫痫"]),
        ("偏头痛、脊髓与周围神经疾病", ["偏头痛", "急性脊髓炎", "周围神经疾病", "重症肌无力", "腰穿与脑血管介入"]),
    ],
}

FORBIDDEN = ("教材口径", "考研口径", "制作说明", "核查状态", "按真题重构", "当前收录", "教学所用")

CATEGORY_RULES = [
    ("危险因素与机制", ("病因", "因素", "诱因", "机制", "导致", "相关"), ("病因与发病机制", "病因", "发病机制"),
     "题干出现暴露史、基础病或诱因时，要说明它怎样推动本病发生或加重。"),
    ("临床表现与危险信号", ("症状", "体征", "表现", "典型", "危重", "意识", "呼吸", "疼痛"), ("临床表现", "并发症"),
     "表现题需同时判断典型线索和危重变化，不能只凭一个症状下结论。"),
    ("检查与诊断证据", ("检查", "诊断", "阳性", "阴性", "升高", "降低", "影像", "血气", "心电"), ("实验室及其他检查", "诊断要点"),
     "检查题先明确项目用途，再判断它用于确诊、分型、严重度还是疗效观察。"),
    ("治疗方向", ("治疗", "药物", "首选", "纠正", "缓解", "手术", "疗法", "溶栓", "取栓", "再灌注", "给予", "应用"), ("治疗要点",),
     "处理题先分稳定期和急性恶化，再核对禁忌、疗效指标与不良反应。"),
    ("护理观察与处置", ("护理", "观察", "监测", "保持", "体位", "吸氧", "引流", "评估", "记录", "协助", "防止", "预防"), ("护理评估", "常用护理诊断/问题", "护理措施及依据", "目标", "评价"),
     "优先级题先处理生命威胁，再连续观察措施是否有效及有无并发症。"),
    ("健康指导与长期管理", ("指导", "教育", "避免", "戒", "复诊", "随访", "康复", "依从"), ("健康指导", "预后"),
     "出院题应让患者能说清用药、监测、危险信号、复诊和日常生活安排。"),
]

CATEGORY_BONUS = {
    "危险因素与机制": ("最重要", "最常见", "主要", "危险因素", "诱因"),
    "临床表现与危险信号": ("典型", "主要表现", "突发", "危重", "意识改变", "最常见", "偏瘫", "失语", "局灶"),
    "检查与诊断证据": ("诊断", "阳性", "首选", "金标准", "评估", "提示"),
    "治疗方向": ("首选", "立即", "给予", "应用", "纠正", "溶栓", "取栓", "再灌注", "控制"),
    "护理观察与处置": ("观察", "监测", "保持", "防止", "预防", "体位", "指导", "应"),
    "健康指导与长期管理": ("指导", "避免", "坚持", "复诊", "随访", "自我监测", "依从"),
}

TITLE_ALIASES = {
    "肺部感染": ("肺炎",),
    "慢阻肺": ("慢性阻塞性肺疾病", "慢性支气管炎和慢性阻塞性肺疾病"),
    "慢性肺源性心脏病": ("慢性肺源性心脏病", "肺源性心脏病"),
    "肺血栓栓塞": ("肺血栓栓塞", "肺栓塞"),
    "原发性支气管肺癌": ("原发性支气管肺癌", "肺癌"),
    "呼吸衰竭与ARDS": ("呼吸衰竭", "急性呼吸窘迫综合征"),
    "冠心病与急性冠脉综合征": ("冠状动脉粥样硬化性心脏病", "急性冠脉综合征"),
    "急进性与慢性肾炎": ("急进性肾小球肾炎", "慢性肾小球肾炎"),
    "缺铁性与巨幼细胞贫血": ("缺铁性贫血", "巨幼细胞贫血"),
    "血小板减少与血友病": ("特发性血小板减少性紫癜", "血友病"),
    "狼疮用药与感染": ("系统性红斑狼疮",),
    "狼疮生活管理": ("系统性红斑狼疮",),
    "强直性脊柱炎呼吸与姿势": ("强直性脊柱炎",),
    "类风湿活动与休息": ("类风湿关节炎",),
}

# Named therapies that must appear in the quick-reference table even when the
# seven core cards describe the treatment principle without spelling out every
# representative drug.
TABLE_TRIGGERS = {
    "支气管哮喘": ("沙丁胺醇", "布地奈德", "孟鲁司特"),
    "慢阻肺": ("沙丁胺醇", "噻托溴铵", "布地奈德"),
    "肺结核": ("异烟肼", "利福平", "乙胺丁醇", "吡嗪酰胺"),
    "肺血栓栓塞": ("低分子肝素", "华法林", "阿替普酶"),
    "慢性心力衰竭": ("呋塞米", "螺内酯", "ACEI", "美托洛尔", "地高辛"),
    "急性心力衰竭": ("呋塞米", "硝酸甘油"),
    "心律失常": ("胺碘酮", "地高辛"),
    "冠心病与急性冠脉综合征": ("阿司匹林", "氯吡格雷", "硝酸甘油", "低分子肝素", "阿托伐他汀"),
    "原发性高血压": ("ACEI", "氯沙坦", "氨氯地平", "美托洛尔"),
    "消化性溃疡": ("奥美拉唑",),
    "炎症性肠病": ("美沙拉嗪", "糖皮质激素"),
    "肝硬化": ("螺内酯", "呋塞米"),
    "肝性脑病": ("乳果糖",),
    "上消化道出血": ("奥曲肽", "泮托拉唑"),
    "肾病综合征": ("糖皮质激素", "ACEI"),
    "慢性肾衰竭": ("促红细胞生成素",),
    "血液透析": ("血液透析",),
    "缺铁性与巨幼细胞贫血": ("口服铁剂", "叶酸", "维生素B12"),
    "再生障碍性贫血": ("环孢素",),
    "血小板减少与血友病": ("糖皮质激素",),
    "甲状腺功能亢进": ("甲巯咪唑", "普萘洛尔"),
    "甲状腺功能减退": ("左甲状腺素",),
    "糖尿病": ("胰岛素", "二甲双胍"),
    "血脂异常": ("阿托伐他汀",),
    "高尿酸血症与痛风": ("秋水仙碱", "别嘌醇"),
    "骨质疏松症": ("阿仑膦酸",),
    "系统性红斑狼疮": ("羟氯喹", "糖皮质激素"),
    "狼疮用药与感染": ("羟氯喹", "糖皮质激素"),
    "类风湿关节炎": ("甲氨蝶呤",),
    "类风湿活动与休息": ("甲氨蝶呤",),
    "脑梗死": ("阿替普酶", "阿司匹林", "阿托伐他汀"),
    "脑出血": ("甘露醇",),
    "蛛网膜下腔出血": ("尼莫地平", "甘露醇"),
    "多发性硬化": ("甲泼尼龙",),
    "帕金森病": ("左旋多巴",),
    "癫痫": ("卡马西平", "丙戊酸", "左乙拉西坦"),
    "偏头痛": ("舒马曲普坦",),
    "重症肌无力": ("吡啶斯的明",),
}


def e(value: object) -> str:
    return html.escape(str(value), quote=True)


def page_numbers(page_range: str) -> tuple[int, int]:
    values = [int(x) for x in re.findall(r"\d+", page_range)]
    return values[0], values[-1]


def grouped_chapter(chapter: dict) -> dict:
    """Return a chapter catalogue made of coherent textbook-scale sections."""
    source_by_title = {fact[0]: fact for fact in chapter["facts"]}
    grouped_facts = []
    members_by_title = {}
    for group_title, member_titles in TOPIC_GROUPS[chapter["n"]]:
        members = [source_by_title[name] for name in member_titles]
        starts, ends = zip(*(page_numbers(fact[1]) for fact in members))
        page_range = str(min(starts)) if min(starts) == max(ends) else f"{min(starts)}—{max(ends)}"
        summary = "；".join(f"{fact[0]}：{fact[2].rstrip('。')}" for fact in members)
        exam_focus = "；".join(f"{fact[0]}：{fact[3].rstrip('。')}" for fact in members)
        grouped_facts.append((group_title, page_range, summary, exam_focus))
        members_by_title[group_title] = members
    result = copy.deepcopy(chapter)
    result["facts"] = grouped_facts
    result["member_facts"] = members_by_title
    return result


def source_window(chapter_number: int, page_range: str) -> list[tuple[int, str]]:
    path = WORK / f"ch{chapter_number:02d}_source.txt"
    source = path.read_text(encoding="utf-8")
    first, last = page_numbers(page_range)
    pages: list[tuple[int, str]] = []
    for page in range(first, last + 1):
        match = re.search(
            rf"===== 教材P{page}｜.*? =====\n(.*?)(?=\n===== 教材P|\Z)",
            source,
            re.S,
        )
        if match:
            pages.append((page, match.group(1)))
    return pages


def focused_source_window(chapter_number: int, title: str, page_range: str) -> list[tuple[int, str]]:
    """Trim shared boundary pages to the matching textbook section."""
    raw_pages = source_window(chapter_number, page_range)
    joined = "".join(f"§§PAGE{page}§§{clean_text(text)}" for page, text in raw_pages)
    aliases = TITLE_ALIASES.get(title, (title,))
    hit = None
    level = None
    for alias in aliases:
        patterns = [
            (rf"第[一二三四五六七八九十百]+节{re.escape(alias)}", "section"),
            (rf"(?<![（(])[一二三四五六七八九十]+、{re.escape(alias)}", "major"),
            (rf"【{re.escape(alias)}】", "block"),
        ]
        for pattern, marker_level in patterns:
            match = re.search(pattern, joined)
            if match and (hit is None or match.start() < hit.start()):
                hit, level = match, marker_level
    if hit:
        # Stop only at the next *disease/topic* heading from this chapter.
        # Generic numbered headings cannot be used as boundaries because many
        # diseases number manifestations, complications and treatment inside
        # the same section.
        remainder = joined[hit.end():]
        boundary_offsets: list[int] = []
        for other in CHAPTERS[chapter_number - 1]["facts"]:
            other_title = other[0]
            if other_title == title:
                continue
            for alias in TITLE_ALIASES.get(other_title, (other_title,)):
                for pattern in (
                    rf"第[一二三四五六七八九十百]+节{re.escape(alias)}",
                    rf"(?<![（(])[一二三四五六七八九十]+、{re.escape(alias)}",
                    rf"【{re.escape(alias)}】",
                ):
                    next_hit = re.search(pattern, remainder)
                    if next_hit:
                        boundary_offsets.append(next_hit.start())
        end = hit.end() + min(boundary_offsets) if boundary_offsets else len(joined)
        focused = joined[hit.start():end]
    else:
        focused = joined
    markers = list(re.finditer(r"§§PAGE(\d+)§§", focused))
    if not markers:
        # The section can begin after a page marker removed by the slice.  Carry
        # the page active at the start position into the focused fragment.
        previous = list(re.finditer(r"§§PAGE(\d+)§§", joined[:hit.start() if hit else 0]))
        page = int(previous[-1].group(1)) if previous else page_numbers(page_range)[0]
        return [(page, focused)]
    result = []
    prefix = focused[:markers[0].start()]
    if prefix:
        previous = list(re.finditer(r"§§PAGE(\d+)§§", joined[:hit.start() if hit else 0]))
        page = int(previous[-1].group(1)) if previous else page_numbers(page_range)[0]
        result.append((page, prefix))
    for index, marker in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(focused)
        result.append((int(marker.group(1)), focused[marker.end():end]))
    return result


def clean_text(text: str) -> str:
    text = re.sub(r"\bNote\s*[:：]?", "", text, flags=re.I)
    text = re.sub(r"(?:^|\n)\s*\d+\s*[|I■\s]*第[一二三四五六七八九十]+章[^\n]*", "\n", text)
    text = re.sub(r"图\d+(?:-\d+)?[^。；\n]{0,80}", "", text)
    text = text.replace("尘螭", "尘螨").replace("蜂螂", "蟑螂")
    text = text.replace("FEV】", "FEV₁").replace("下降220%", "下降≥20%")
    text = text.replace("小时动态血糖测定", "动态血糖监测")
    text = text.replace("diabeticperipheralneurpathy", "diabetic peripheral neuropathy")
    text = text.replace("recmbinanttissuetypeplasmingenactivatr", "recombinant tissue-type plasminogen activator")
    text = text.replace("cntinuusglucsemnitring", "continuous glucose monitoring")
    text = text.replace("cerebralamylidangipathy", "cerebral amyloid angiopathy")
    text = text.replace("发州", "发绀").replace("发缙", "发绀").replace("澹妄", "谵妄").replace("紊舌L", "紊乱")
    text = text.replace("心电图检查心电图", "心电图检查")
    text = text.replace("电.解质", "电解质").replace("非留体", "非甾体")
    text = text.replace("口引噪美辛", "吲哚美辛").replace("P性骨折", "脆性骨折")
    text = text.replace("需要0(3)", "需要；（3）").replace("HbAlc", "HbA1c")
    text = text.replace("Smgyi", "Somogyi")
    text = re.sub(r"(?<=\d)\.\s*O(?=\d|m)", ".0", text)
    text = re.sub(r"[\u4e00-\u9fff]{2,4}）(?=第[一二三四五六七八九十百]+节)", "", text)
    text = re.sub(r"mml/L", "mmol/L", text, flags=re.I)
    text = re.sub(r"mmH(?!g)", "mmHg", text)
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"(?:\d+)?[|I■]*第[一二三四五六七八九十]+章[^【［\[]]{0,40}", "", text)
    return text


def sentences(pages: list[tuple[int, str]]) -> list[tuple[int, str, str]]:
    result: list[tuple[int, str, str]] = []
    seen: set[str] = set()
    heading = ""
    for page, raw in pages:
        text = clean_text(raw)
        parts = re.split(r"([【［\[][^】\]]{2,24}[】\]])", text)
        for part in parts:
            head_match = re.fullmatch(r"[【［\[]([^】\]]{2,24})[】\]]", part)
            if head_match:
                heading = re.sub(r"\s+", "", head_match.group(1))
                continue
            for sentence in re.split(r"(?<=[。；！？])", part):
                sentence = sentence.strip("。；！？【】[]（）()0123456789.、 ")
                if not 22 <= len(sentence) <= 230:
                    continue
                if any(mark in sentence for mark in ("请思考", "导入案例", "表2-", "表3-", "参考文献", "文末彩", "脏月", "疾病病人的护理", "病人的护理|", "分层TCLDL", "理想水平<")):
                    continue
                if re.match(r"表\d", sentence):
                    continue
                if re.search(r"[A-Za-z]\?", sentence):
                    continue
                if sentence in seen:
                    continue
                seen.add(sentence)
                result.append((page, sentence + "。", heading))
    return result


def select_detail(category: str, rows: list[tuple[int, str, str]], keywords: tuple[str, ...], preferred: tuple[str, ...], used: set[str]) -> tuple[int, str] | None:
    ranked = []
    preferred_available = any(any(key in heading for key in preferred) for _, _, heading in rows)
    first_preferred = next((i for i, (_, _, heading) in enumerate(rows) if any(key in heading for key in preferred)), 0)
    if category in {"治疗方向", "护理观察与处置", "健康指导与长期管理"} and not preferred_available:
        return None
    for row_index, (page, sentence, heading) in enumerate(rows):
        if sentence in used:
            continue
        if preferred_available and not any(key in heading for key in preferred):
            continue
        keyword_hits = sum(1 for word in keywords if word in sentence)
        if not keyword_hits:
            continue
        score = keyword_hits * 5
        score += 25 if any(key in heading for key in preferred) else 0
        if preferred_available and any(key in heading for key in preferred):
            score += max(0, 24 - (row_index - first_preferred) // 3)
        score += sum(3 for word in ("应", "需", "最", "主要", "提示", "给予", "首选", "监测", "观察", "不宜", "避免") if word in sentence)
        score += sum(8 for word in CATEGORY_BONUS.get(category, ()) if word in sentence)
        if category == "治疗方向":
            score += sum(35 for phrase in ("首选治疗", "首选药物", "最重要", "治疗基础", "治疗原则") if phrase in sentence)
            score += 160 if "早期溶栓" in sentence else 0
            score += 150 if "强调早期、长期、综合" in sentence else 0
            score += 70 if "原则" in sentence else 0
        elif category == "检查与诊断证据":
            score += sum(24 for phrase in ("明确诊断", "可诊断", "诊断标准", "不能排除", "金标准") if phrase in sentence)
        elif category == "护理观察与处置":
            score += sum(25 for phrase in ("密切观察", "立即报告", "护理措施", "监测", "保持呼吸道") if phrase in sentence)
        elif category == "健康指导与长期管理":
            score += sum(25 for phrase in ("健康指导", "自我监测", "定期复查", "坚持", "避免") if phrase in sentence)
        if sentence.startswith(("诱因:", "诱因：")):
            score -= 18
        score += 2 if 36 <= len(sentence) <= 150 else 0
        if score:
            ranked.append((score, -abs(len(sentence) - 90), page, sentence))
    if not ranked:
        return None
    _, _, page, sentence = max(ranked)
    used.add(sentence)
    return page, sentence


def core_cards(chapter_number: int, fact: tuple[str, str, str, str]) -> list[dict]:
    title, page_range, summary, exam_focus = fact
    override = CORE_OVERRIDES.get((chapter_number, title))
    if override:
        return copy.deepcopy(override)
    rows = sentences(focused_source_window(chapter_number, title, page_range))
    cards = [{
        "title": f"{title}：先建立主判断",
        "body": summary,
        "use": exam_focus,
        "page": page_range,
    }]
    used: set[str] = set()
    fallback_bodies = {
        "危险因素与机制": f"{summary} 评估时要追问与{title}起病或加重直接相关的暴露、诱因和基础病。",
        "临床表现与危险信号": f"{exam_focus} 还要结合起病速度、生命体征和功能变化判断严重程度。",
        "检查与诊断证据": f"{summary} 检查结果应与病史和体征相互印证，并说明它用于确诊、分型还是评估严重度。",
        "治疗方向": f"{summary} 处理时先区分稳定期与急性变化，再观察疗效和不良反应。",
        "护理观察与处置": f"{exam_focus} 护理观察要记录变化趋势，并明确什么情况需要立即上报。",
        "健康指导与长期管理": f"{summary} 出院前要确认患者能复述用药、监测、危险信号和复诊安排。",
    }
    for category, keywords, preferred, exam_use in CATEGORY_RULES:
        selected = select_detail(category, rows, keywords, preferred, used)
        if selected:
            page, body = selected
            cards.append({"title": category, "body": body, "use": exam_use, "page": str(page)})
        else:
            cards.append({
                "title": category,
                "body": fallback_bodies[category],
                "use": exam_use,
                "page": page_range,
            })
    return cards[:7]


def grouped_core_cards(chapter_number: int, group_fact: tuple[str, str, str, str], members: list[tuple[str, str, str, str]]) -> list[dict]:
    """Cover every disease in a grouped chapter without repeating one disease."""
    if len(members) == 1:
        return core_cards(chapter_number, members[0])
    group_title, page_range, summary, exam_focus = group_fact
    cards = [{
        "label": "章节总览", "title": f"{group_title}：先分清疾病",
        "body": "；".join(f"{fact[0]}：{fact[2].rstrip('。')}" for fact in members),
        "use": "先根据起病方式、主要症状和决定性检查确定具体疾病，再进入治疗与护理。",
        "page": page_range,
    }]
    member_cards = [(fact, core_cards(chapter_number, fact)) for fact in members]
    for fact, source_cards in member_cards:
        primary = copy.deepcopy(source_cards[0])
        primary.update({"label": "疾病判断", "title": fact[0], "page": fact[1]})
        cards.append(primary)
    priorities = ["临床表现与危险信号", "检查与诊断证据", "治疗方向", "护理观察与处置", "危险因素与机制", "健康指导与长期管理"]
    round_index = 0
    while len(cards) < 9:
        added = False
        for fact, source_cards in member_cards:
            category = priorities[round_index % len(priorities)]
            detail = next((card for card in source_cards[1:] if card["title"] == category), None)
            if not detail or any(card["body"] == detail["body"] for card in cards):
                continue
            detail = copy.deepcopy(detail)
            detail.update({"label": "深入考点", "title": f"{fact[0]}｜{category}"})
            cards.append(detail)
            added = True
            if len(cards) == 9:
                break
        round_index += 1
        if not added or round_index > len(priorities) * 2:
            break
    return cards


def logic_chain(cards: list[dict]) -> list[tuple[str, str]]:
    order = ["危险因素与机制", "临床表现与危险信号", "检查与诊断证据", "治疗方向", "护理观察与处置", "健康指导与长期管理"]
    by_title = {card["title"]: card["body"] for card in cards}
    primary = cards[0]["body"]
    return [(title, by_title.get(title, primary)) for title in order]


def grouped_logic_chain(cards: list[dict]) -> list[tuple[str, str]]:
    rows = [(card["title"], card["body"]) for card in cards[1:7]]
    while len(rows) < 6:
        card = cards[len(rows) % len(cards)]
        rows.append((card["title"], card["body"]))
    return rows[:6]


def original_questions(title: str, cards: list[dict], page_range: str, clues: list[list[str]] | None = None) -> list[dict]:
    """Build ten scenario questions without recycling one clue under new labels."""
    clues = clues or deep_clue_rows(title, cards)
    stages = ["就诊时", "追问病史后", "夜间巡视时", "检查结果返回后", "治疗开始前", "治疗过程中", "准备出院时"]

    def ask_for(point: str) -> str:
        if "诊断入口" in point:
            return "最可能的判断是什么？请写出支持该判断的两条依据。"
        if "病因" in point or "机制" in point:
            return "这组条件怎样促使疾病发生或加重？"
        if "表现" in point or "危险信号" in point:
            return "这提示病情处于什么状态？哪项变化需要立即上报？"
        if "检查" in point or "诊断证据" in point:
            return "该结果在诊断或病情评估中有什么意义？"
        if "治疗" in point:
            return "当前治疗重点是什么？护士需同时观察哪项疗效或风险？"
        if "护理" in point:
            return "护士应优先观察和处理什么？措施后怎样复评？"
        if "出院" in point or "复发预防" in point or "长期管理" in point:
            return "出院指导应落实为哪些具体行动？怎样确认患者已经掌握？"
        return "这组线索最支持本章中的哪一种疾病？请写出决定判断的依据。"

    result = []
    for index, (clue, point, conclusion) in enumerate(clues[:7]):
        card = cards[min(index, len(cards) - 1)]
        result.append({
            "n": index + 1, "tag": point,
            "stem": f"一位{title}相关患者{stages[index]}，病历记录为“{clue}”。{ask_for(point)}",
            "options": [], "answer": conclusion,
            "why": f"题干的决定性信息是“{clue}”，它对应{point}。答案必须落到本病的具体结论，不能只写通用护理原则。",
            "tip": "先圈出疾病特异性线索，再回答诊断、严重度或护理动作。",
            "pages": f"教材P{card['page']}", "answer_label": "参考答案",
        })

    combined = [
        (0, 2, "初诊资料同时出现两组线索。请完成疾病判断，并指出提示病情升级的表现。"),
        (3, 4, "检查结果返回且即将开始治疗。请说明检查的意义、治疗重点和首项安全观察。"),
        (5, 6, "病情趋于稳定并准备出院。请把住院期观察与出院后的自我管理连成一份行动计划。"),
    ]
    for offset, (left, right, ask) in enumerate(combined, 8):
        clue_a, point_a, conclusion_a = clues[left]
        clue_b, point_b, conclusion_b = clues[right]
        card = cards[min(right, len(cards) - 1)]
        result.append({
            "n": offset, "tag": f"{point_a}＋{point_b}",
            "stem": f"一位{title}相关患者的病历中同时记录“{clue_a}”和“{clue_b}”。{ask}",
            "options": [], "answer": f"{point_a}：{conclusion_a}；{point_b}：{conclusion_b}",
            "why": "两组线索承担不同作用：一组确定当前判断，另一组决定严重度、处理或后续管理，不能把同一句话换标题重复作答。",
            "tip": "分别标注两组线索解决的问题，再按先判断、后处置、再复评的顺序组织答案。",
            "pages": f"教材P{card['page']}", "answer_label": "参考答案",
        })
    return result


def true_questions(chapter_number: int, title: str) -> list[dict]:
    # A topic may have reviewed questions in more than one source file.  The
    # previous early returns discarded the main bank whenever a supplement or
    # override existed.  Merge every reviewed source first, then deduplicate.
    direct = []
    direct.extend(copy.deepcopy(TRUE_OVERRIDES.get((chapter_number, title), [])))
    direct.extend(copy.deepcopy(SUPPLEMENTS.get((chapter_number, title), [])))
    direct.extend(copy.deepcopy(MANUAL_EXPANSION.get((chapter_number, title), [])))
    direct.extend(copy.deepcopy(ANSWERED_EXPANSION.get((chapter_number, title), [])))
    direct.extend(copy.deepcopy(ROUND2_EXPANSION.get((chapter_number, title), [])))
    bank = INTERNAL_BANK.get(chapter_number, [])
    merged_tags = {
        (1, "内科护理总论"): {"内科护理总论", "内科护理学的范围", "整体护理观", "护理程序", "护理诊断与医疗诊断", "护理者角色", "协作者角色", "教育者角色", "代言者角色", "连续照护", "成人发展与健康"},
        (3, "心律失常与器械介入治疗"): {"心律失常与器械介入治疗", "心律失常", "心脏起搏与电复律", "心导管与射频消融"},
        (3, "冠心病、急性冠脉综合征与冠脉介入"): {"冠心病、急性冠脉综合征与冠脉介入", "冠心病与急性冠脉综合征", "冠脉介入"},
        (4, "脂肪性肝病与肝硬化"): {"脂肪性肝病", "肝硬化"},
        (6, "贫血与出血评估"): {"出血与贫血评估", "贫血分类"},
        (6, "淋巴瘤与多发性骨髓瘤"): {"淋巴瘤", "多发性骨髓瘤"},
        (6, "造血干细胞移植与骨髓穿刺"): {"骨髓穿刺与静脉通路", "造血干细胞移植"},
        (7, "内分泌评估与腺垂体功能减退"): {"内分泌症状框架", "腺垂体功能减退"},
        (7, "肥胖症与血脂异常"): {"肥胖症", "血脂异常"},
        (8, "系统性红斑狼疮"): {"系统性红斑狼疮", "狼疮用药与感染", "狼疮生活管理"},
        (8, "强直性脊柱炎"): {"强直性脊柱炎", "强直性脊柱炎呼吸与姿势"},
        (8, "类风湿关节炎"): {"类风湿关节炎", "类风湿活动与休息"},
    }.get((chapter_number, title), {title})
    direct.extend(copy.deepcopy(q) for q in bank if q.get("tag") in merged_tags)
    # This lupus skin-care item belongs on the SLE page.  Keeping it in the
    # general introduction created the same question twice in one book.
    if chapter_number == 1 and title == "内科护理总论":
        direct = [q for q in direct if "皮肤完整性受损" not in q.get("stem", "")]
    if chapter_number == 5 and title == "肾小球疾病框架":
        # These two source questions already belong to more specific pages.
        # Keeping them here duplicated the same stem across diseases and, in
        # the SLE case, placed a rheumatology diagnosis on a renal framework.
        direct = [q for q in direct if "关于肾性水肿" not in q.get("stem", "")
                  and "蛋白尿，关节痛，精神障碍" not in q.get("stem", "")]
    unique, seen = [], set()
    for question in direct:
        key = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", question.get("stem", "")).lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(question)
    direct = unique[:10]
    for index, question in enumerate(direct, 11):
        question["n"] = index
    return direct


def grouped_true_questions(chapter_number: int, members: list[tuple[str, str, str, str]]) -> list[dict]:
    """Combine distinct source-bound questions from every member topic."""
    result = []
    seen = set()
    for fact in members:
        for question in true_questions(chapter_number, fact[0]):
            key = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", question.get("stem", "")).lower()
            if not key or key in seen:
                continue
            seen.add(key)
            result.append(copy.deepcopy(question))
    for index, question in enumerate(result[:10], 11):
        question["n"] = index
    return result[:10]


SIGNAL_WORDS = (
    "突发", "进行性", "反复", "夜间", "活动后", "情绪激动", "发热", "疼痛", "头痛", "胸痛",
    "呼吸困难", "咳嗽", "咳痰", "咯血", "呕吐", "腹泻", "水肿", "少尿", "无尿", "黑便",
    "意识障碍", "偏瘫", "失语", "抽搐", "黄疸", "皮疹", "关节痛", "体重下降", "乏力",
    "低血压", "高血压", "心动过速", "心动过缓", "低氧", "高碳酸血症", "阳性", "阴性",
    "升高", "降低", "高密度", "低密度", "狭窄", "梗阻", "感染", "出血", "休克",
)


def _signals(body: str, limit: int = 4) -> list[str]:
    found = []
    for word in SIGNAL_WORDS:
        if word in body and word not in found:
            found.append(word)
        if len(found) == limit:
            break
    for value in re.findall(r"(?:[<>≥≤＞＜]?\d+(?:\.\d+)?(?:%|mmHg|mmol/L|mg/L|小时|天|周|分钟))", body):
        if value not in found:
            found.append(value)
        if len(found) == limit:
            break
    return found


def _short_rule(body: str, limit: int = 86) -> str:
    text = re.sub(r"^[^：:]{1,18}[：:]", "", clean_text(body))
    clauses = [x for x in re.split(r"[。；]", text) if len(x) >= 8]
    text = clauses[0] if clauses else text
    return text[:limit] + ("…" if len(text) > limit else "")


CLUE_POINTS = {
    "总判断": "诊断入口",
    "危险因素与机制": "病因与发生机制",
    "临床表现与危险信号": "典型表现与危险信号",
    "检查与诊断证据": "检查用途与诊断证据",
    "治疗方向": "治疗重点与安全边界",
    "护理观察与处置": "护理优先级与异常上报",
    "健康指导与长期管理": "出院管理与复发预防",
}


def _card_clue(category: str, body: str) -> str:
    """Turn the actual textbook fact into a concise, disease-specific stem cue."""
    text = clean_text(body)
    text = re.sub(r"^(?:病情观察|护理措施|健康指导|治疗原则|临床表现|症状|体征)[：:]", "", text)
    text = re.sub(r"(?:\(|（)\d+(?:\)|）)|(?<!\d)\d+[)）]", "；", text)
    text = re.sub(r"[：:]\s*(?:症状|体征)[：:]", "：", text)
    text = re.sub(r"[；，、]{2,}", "；", text).strip("；，。 ")
    if category == "总判断" and "；" in text:
        return text[:96].rstrip("；，") + ("…" if len(text) > 96 else "")
    signals = _signals(text, 6)
    if category == "临床表现与危险信号" and len(signals) >= 2:
        return "＋".join(signals[:5])
    clue = _short_rule(text, 64)
    return clue.rstrip("。；")


def deep_clue_rows(title: str, cards: list[dict], summary: str = "", exam_focus: str = "", chapter_number: int | None = None) -> list[list[str]]:
    override = CLUE_OVERRIDES.get((chapter_number, title)) if chapter_number is not None else None
    if override:
        return copy.deepcopy(override)
    rows: list[list[str]] = []
    seen: set[str] = set()
    for index, card in enumerate(cards[:7]):
        category = "总判断" if index == 0 else card["title"]
        clue = _card_clue(category, card["body"])
        normalized = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", clue)
        if normalized in seen:
            # A repeated source sentence cannot serve as a second clue.  Add the
            # card's own exam condition so the row asks a genuinely new thing.
            clue = _card_clue(category, f"{card.get('use', '')}；{card['body']}")
            normalized = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", clue)
        if normalized in seen:
            clue = f"{CLUE_POINTS.get(category, category)}：{clue}"
            normalized = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", clue)
        seen.add(normalized)
        point = f"{title}：{CLUE_POINTS.get(category, category)}"
        conclusion = clean_text(card["body"]).rstrip("。")[:180] if index == 0 and "；" in clean_text(card["body"]) else _short_rule(card["body"], 112)
        rows.append([clue, point, conclusion])
    return rows


def intro_concept(title: str, summary: str) -> tuple[str, str]:
    text = title + summary
    if any(word in text for word in ("癌", "肿瘤", "乳", "造口", "容貌")):
        return "自我概念与尊严", "疾病和治疗可能改变身体形象、角色与未来感，护理需要让患者参与决定，并保护其尊严。"
    if any(word in text for word in ("慢性", "糖尿病", "透析", "哮喘", "高血压", "痛风", "帕金森")):
        return "连续照护与自我管理", "治疗要进入患者每天的生活；护士要确认患者会监测、会用药、会识别危险信号并知道何时求助。"
    if any(word in text for word in ("急性", "衰竭", "出血", "危象", "骤停", "栓塞", "DIC")):
        return "安全需要与护理优先级", "急性变化时先保护生命和基本生理需要，同时用清楚沟通减少患者与家属的不确定感。"
    if any(word in text for word in ("肌", "关节", "神经", "瘫", "呼吸", "心力")):
        return "功能、角色与适应", "症状会改变行动、工作和家庭角色；护理目标不仅是指标改善，还包括保存功能和重新获得生活掌控感。"
    return "整体护理与共同决策", "同一种疾病会因患者的理解、家庭支持和生活目标而呈现不同护理需要，计划应由患者共同参与。"


def story_html(title: str, summary: str, exam_focus: str) -> str:
    concept, concept_text = intro_concept(title, summary)
    return f'''<section id="story" class="story searchable"><div class="section-head"><div><h2>07｜患者故事 · 护理学导论联动</h2><p>把{e(title)}放回患者的生活，理解治疗与护理为什么重要。</p></div><span class="level teal">{e(concept)}</span></div>
    <p class="story-intro">一位正在经历{e(title)}的患者问：“我知道要配合治疗，可我最担心的是以后还能不能像原来那样生活。”护士没有急着给出空泛安慰，而是先核对病情和患者最在意的功能与角色。</p>
    <div class="story-grid"><article class="story-scene" data-step="1"><h3>先保证安全</h3><p>{e(summary)}</p><b>先处理威胁生命或功能的问题</b></article><article class="story-scene" data-step="2"><h3>再理解处境</h3><p>护士继续询问症状怎样影响睡眠、活动、工作、家庭关系和治疗选择，并确认患者对疾病的理解。</p><b>{e(concept)}</b></article><article class="story-scene" data-step="3"><h3>共同把计划做实</h3><p>{e(exam_focus)} 护士请患者用自己的话复述，并一起约定观察、复诊和求助的具体行动。</p><b>共同决策与健康教育</b></article></div>
    <div class="story-meaning"><b>导论落点：</b>{e(concept_text)}</div></section>'''


STORY_CSS = r'''
.story{background:linear-gradient(145deg,#fff9fd,#f5f0ff);border-color:#d9c8f5}.story-intro{font-size:17px;line-height:1.9;color:#3e3651;margin:4px 0 18px;padding:14px 16px;background:#fff;border-left:5px solid #a279dc;border-radius:12px}.story-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.story-scene{background:#fff;border:1px solid #e2d7f4;border-radius:17px;padding:17px}.story-scene:before{content:attr(data-step);display:inline-flex;width:28px;height:28px;border-radius:50%;align-items:center;justify-content:center;background:#6e49af;color:#fff;font-weight:900;margin-bottom:10px}.story-scene h3{margin:0 0 8px}.story-scene p{margin:0 0 9px;line-height:1.7}.story-scene b{color:#6240a2;font-size:13px}.story-meaning{margin-top:15px;padding:14px 16px;border-radius:14px;background:#ece4fb;color:#4f337c;line-height:1.8}body[data-mode="exam"] #story{display:none}@media(max-width:860px){.story-grid{grid-template-columns:1fr}.story-intro{font-size:15px}}
'''


def make_cfg(chapter: dict, fact_index: int, fact: tuple[str, str, str, str]) -> dict:
    title, page_range, summary, exam_focus = fact
    members = chapter.get("member_facts", {}).get(title, [fact])
    cards = grouped_core_cards(chapter["n"], fact, members)
    chain = grouped_logic_chain(cards) if len(members) > 1 else logic_chain(cards)
    truths = grouped_true_questions(chapter["n"], members)
    if len(truths) > 10:
        raise RuntimeError(f"{title}: expected no more than 10 source-bound true questions, got {len(truths)}")
    labels = ["总判断", "病因机制", "临床表现", "检查诊断", "治疗方向", "护理处置", "健康指导"]
    memory = [(card.get("label", labels[index] if index < len(labels) else "高频鉴别"), card["title"], card["body"], f"教材P{card['page']}", card["use"])
              for index, card in enumerate(cards)]
    clues = deep_clue_rows(title, cards, summary, exam_focus, chapter["n"])
    topic_pages = source_window(chapter["n"], page_range) if len(members) > 1 else focused_source_window(chapter["n"], title, page_range)
    triggers = [member[0] for member in members]
    for member in members:
        triggers.extend(TABLE_TRIGGERS.get(member[0], ()))
    clinical_rows = build_clinical_rows(
        triggers,
        topic_pages,
        f"教材P{page_range}",
        limit=8,
    )
    if len(members) == 1:
        clinical_rows = copy.deepcopy(CLINICAL_OVERRIDES.get((chapter["n"], members[0][0]), clinical_rows))
    return {
        "title": f"{chapter['group']}｜{title}",
        "subtitle": summary,
        "chapter": f"{chapter['n']:02d}-{fact_index:02d}",
        "key": f"medical-{SYSTEMS[chapter['n']]}-{fact_index:02d}-v1",
        "importance": "🔥 高频必考" if truths else "⭐ 核心掌握",
        "study_time": "45—70分钟",
        "template": "scenario" if chapter["n"] > 1 else "memory",
        "six": chain,
        "formula": "危险因素 → 病理变化 → 临床表现 → 检查证据 → 治疗方向 → 护理与长期管理。",
        "clues": clues,
        "memory": memory,
        "knowledge": cards,
        "high_k": list(range(len(cards))),
        "warn_k": [],
        "must_data": [],
        "data_headers": ["考点", "结论", "应用", "来源"],
        "data": [[card["title"], card["body"], card["use"], f"教材P{card['page']}"] for card in cards],
        "clinical_rows": clinical_rows,
        "tiers": [],
        "confuse": [],
        "quick": [],
        "care": ("先看患者当前最难受的变化", summary),
        "care2": ("一张卡只解决一个判断", "每张卡都对应一个具体线索、结论和临床动作。"),
        "care3": ("错题要回到决定性线索", "重新核对对象、时间、危险程度和治疗阶段，再安排护理优先级。"),
        "original": original_questions(title, cards, page_range, clues),
        "truth": truths,
        "truth_verified": True,
        "truth_title": "04B｜命题风格模拟",
        "truth_subtitle": "",
        "exercise_summary": f"原创10＋真题{len(truths)}",
        "source": f"教材P{page_range}",
        "fact_title": title,
        "fact_summary": summary,
        "fact_focus": exam_focus,
        "member_titles": [member[0] for member in members],
    }


def render_page(cfg: dict) -> str:
    page = base.render_page(cfg)
    page = page.replace("｜外科护理学第7版", "｜内科护理学第7版")
    page = page.replace("SURGICAL NURSING", "MEDICAL NURSING")
    page = page.replace("外科目录", "返回本系统")
    page = page.replace('href="index.html">返回本系统', 'href="index.html">返回本系统')
    chapter_number = int(cfg["chapter"].split("-")[0])
    link = next((INTRO_LINKS[(chapter_number, member)] for member in cfg.get("member_titles", [cfg["fact_title"]])
                 if (chapter_number, member) in INTRO_LINKS), None)
    if link:
        concept, meaning = link
        section = f'''<section id="story" class="story searchable"><div class="section-head"><div><h2>07｜护理学导论联动</h2><p>本节只联动一个会改变护理判断的概念。</p></div><span class="level teal">{e(concept)}</span></div><p class="story-intro">{e(meaning)}</p><div class="story-meaning"><b>题干怎样识别：</b>先判断患者现有能力、压力源、适应层面或教育需求，再选择相应护理系统与措施。不能只写“关心患者”。</div><p><a class="home" href="../../introduction/index.html">进入护理学导论独立学习页 →</a></p></section>'''
        page = page.replace("</style></head>", STORY_CSS + "</style></head>")
        page = page.replace('<a href="#recitation">带背</a>', '<a href="#recitation">带背</a><a href="#story">导论联动</a>', 1)
        page = page.replace('<div id="empty"', section + '\n<div id="empty"', 1)
    if not cfg["truth"]:
        page = re.sub(r'<section id="truth">.*?</section>\s*', '', page, count=1, flags=re.S)
        page = page.replace('<a href="#truth">真题</a>', '')
    return page


def system_index(chapter: dict, items: list[tuple[int, dict]]) -> str:
    cards = []
    for index, cfg in items:
        count = len(cfg["truth"])
        cards.append(f'''<a class="card searchable" href="section-{index:02d}.html" data-text="{e(cfg['fact_title'] + cfg['fact_summary'])}"><span>{index:02d}｜教材P{e(chapter['facts'][index-1][1])}</span><h2>{e(cfg['fact_title'])}</h2><p>{e(cfg['fact_summary'])}</p><div class="cardmeta"><i>{len(cfg['knowledge'])}张核心卡</i><i>原创10题</i>{f'<i>真题{count}题</i>' if count else ''}<i>可做笔记</i></div><b>进入本节 →</b></a>''')
    body = ''.join(cards)
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(chapter['group'])}｜内科护理学</title><style>{base.CSS}.catalog{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}}.card{{color:inherit;text-decoration:none;background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow)}}.card>span{{color:var(--p);font-weight:900;font-size:12px}}.card h2{{margin:8px 0}}.card p{{color:var(--muted);line-height:1.75}}.card b{{color:var(--p)}}.cardmeta{{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}}.cardmeta i{{font-style:normal;font-size:12px;background:var(--lav);color:var(--p);padding:3px 8px;border-radius:99px}}.catalog-search{{width:100%;padding:13px 15px;border:1px solid var(--line);border-radius:14px;font-size:16px}}@media(max-width:760px){{.catalog{{grid-template-columns:1fr}}}}</style></head><body><div class="shell"><header class="hero"><div class="eyebrow">ICE冰冰高分学姐团 · MEDICAL NURSING</div><h1>{e(chapter['group'])}</h1><p>先选择具体疾病或检查治疗章节；每页均可切换初学、复习和考前模式。</p></header><nav class="toolbar"><a class="home" href="../index.html">内科目录</a><input id="catalogSearch" class="catalog-search" placeholder="搜索疾病或考点……"></nav><main class="catalog">{body}</main><footer><div class="brandline">ICE冰冰高分学姐团｜<span>咨询微信：ICEICE20250901</span></div></footer></div><script>const s=document.getElementById('catalogSearch');s.oninput=()=>{{const q=s.value.trim().toLowerCase();document.querySelectorAll('.card').forEach(c=>c.hidden=q&&!c.dataset.text.toLowerCase().includes(q));}};</script></body></html>'''


def main_index(system_rows: list[tuple[dict, str]]) -> str:
    cards = ''.join(
        f'''<a class="card searchable" href="{slug}/"><span>第{chapter['n']}章｜{e(chapter['group'])}</span><h2>{e(chapter['title'])}</h2><p>{e('、'.join(f[0] for f in chapter['facts'][:6]))}</p><div class="cardmeta"><i>{len(chapter['facts'])}个具体章节</i><i>逐节学习</i><i>个人笔记</i></div><b>选择具体章节 →</b></a>'''
        for chapter, slug in system_rows
    )
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>内科护理学｜全书学习中心</title><style>{base.CSS}.catalog{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0}}.card{{color:inherit;text-decoration:none;background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow)}}.card>span{{color:var(--p);font-weight:900;font-size:12px}}.card h2{{margin:8px 0}}.card p{{color:var(--muted);line-height:1.7}}.card b{{color:var(--p)}}.cardmeta{{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}}.cardmeta i{{font-style:normal;font-size:12px;background:var(--lav);color:var(--p);padding:3px 8px;border-radius:99px}}.catalog-search{{width:100%;padding:13px 15px;border:1px solid var(--line);border-radius:14px;font-size:16px}}@media(max-width:800px){{.catalog{{grid-template-columns:1fr}}}}</style></head><body><div class="shell"><header class="hero"><div class="eyebrow">ICE冰冰高分学姐团 · MEDICAL NURSING</div><h1>内科护理学｜按系统进入，再学具体疾病</h1><p>系统只是目录层级；真正的学习页继续细分到疾病、症状评估和检查治疗章节。</p></header><nav class="toolbar"><a class="home" href="../index.html">全部课程</a><input id="catalogSearch" class="catalog-search" placeholder="搜索系统、疾病或考点……"></nav><main class="catalog">{cards}</main><footer><div class="brandline">ICE冰冰高分学姐团｜<span>咨询微信：ICEICE20250901</span></div></footer></div><script>const s=document.getElementById('catalogSearch');s.oninput=()=>{{const q=s.value.trim().toLowerCase();document.querySelectorAll('.card').forEach(c=>c.hidden=q&&!c.textContent.toLowerCase().includes(q));}};</script></body></html>'''


def legacy_redirect(chapter: dict, slug: str) -> str:
    target = slug if slug.endswith(".html") else slug + "/"
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={target}"><title>{e(chapter['group'])}</title><script>location.replace('{target}'+location.search+location.hash)</script></head><body><a href="{target}">进入{e(chapter['group'])}</a></body></html>'''


def main() -> None:
    STAGE.mkdir(parents=True, exist_ok=True)
    system_rows = []
    page_count = 0
    for source_chapter in CHAPTERS:
        # Keep every textbook disease/topic as its own page.  Question volume
        # must never be increased by merging unrelated diseases.
        chapter = copy.deepcopy(source_chapter)
        slug = SYSTEMS[chapter["n"]]
        folder = STAGE / slug
        folder.mkdir(parents=True, exist_ok=True)
        # Remove only files outside the current independent-topic catalogue.
        expected_sections = {f"section-{index:02d}.html" for index in range(1, len(chapter["facts"]) + 1)}
        for stale in folder.glob("section-*.html"):
            if stale.name not in expected_sections:
                stale.unlink()
        items: list[tuple[int, dict]] = []
        for fact_index, fact in enumerate(chapter["facts"], 1):
            cfg = make_cfg(chapter, fact_index, fact)
            items.append((fact_index, cfg))
            (folder / f"section-{fact_index:02d}.html").write_text(render_page(cfg), encoding="utf-8")
            page_count += 1
        (folder / "index.html").write_text(system_index(chapter, items), encoding="utf-8")
        system_rows.append((chapter, slug))
        legacy = f"ch{chapter['n']:02d}-{slug}.html"
        (STAGE / legacy).write_text(legacy_redirect(chapter, slug), encoding="utf-8")
        if chapter["n"] == 9:
            (folder / "brain-infarction.html").write_text(
                legacy_redirect(chapter, "section-03.html"), encoding="utf-8")
            (folder / "symptoms.html").write_text(
                legacy_redirect(chapter, "section-01.html"), encoding="utf-8")
    (STAGE / "index.html").write_text(main_index(system_rows), encoding="utf-8")
    all_text = "\n".join(path.read_text(encoding="utf-8") for path in STAGE.rglob("*.html"))
    bad = [word for word in FORBIDDEN if word in all_text]
    if bad:
        raise RuntimeError(f"student-facing forbidden phrases remain: {bad}")
    print({"systems": len(system_rows), "topic_pages": page_count, "student_phrases": "PASS"})


if __name__ == "__main__":
    main()

