"""
通义千问 (Qwen) 大模型 LLM 服务
提供所有核心分析的 AI 能力：研究选题分析、文献综述生成、
研究思路设计、实验设计、结果解读、情感/语义深度分析

部署: gunicorn -w 2 -b 0.0.0.0:5000 server:app
"""

import json
import os
import re
import time
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ═══════════════════════════════════════
# Qwen 配置
# ═══════════════════════════════════════

QWEN_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
QWEN_MODEL = "qwen-plus"  # 性价比最高: qwen-plus / qwen-max / qwen-turbo

# 注意: 如果 DASHSCOPE_API_KEY 未设置，将使用降级模式
# 获取 API Key: https://dashscope.console.aliyun.com/

# ── 核心调用函数（直接 HTTP API，兼容 Python 3.6+） ──
def call_qwen(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """调用通义千问大模型（HTTP API 直连）"""
    if not QWEN_API_KEY:
        return _fallback_response(prompt)

    try:
        import urllib.request
        import ssl

        url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        body = json.dumps({
            "model": QWEN_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4000,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=body, headers={
            "Authorization": f"Bearer {QWEN_API_KEY}",
            "Content-Type": "application/json",
        })

        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]

    except Exception as e:
        print(f"[Qwen Exception] {e}")
        return _fallback_response(prompt, str(e))


def call_qwen_json(prompt: str, system_prompt: str = "") -> dict:
    """调用 Qwen 并尝试解析 JSON 响应"""
    raw = call_qwen(prompt, system_prompt, temperature=0.3)

    # 尝试提取 JSON
    json_match = re.search(r'\{[\s\S]*\}', raw)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # 尝试提取数组
    arr_match = re.search(r'\[[\s\S]*\]', raw)
    if arr_match:
        try:
            return {"results": json.loads(arr_match.group())}
        except json.JSONDecodeError:
            pass

    return {"raw_text": raw, "parse_error": True}


def _fallback_response(prompt: str, reason: str = "API Key 未配置") -> str:
    """降级响应：当 Qwen API 不可用时给出引导信息"""
    keywords = "、".join(
        re.findall(r'"([^"]*?)"', prompt)[:5]
        or re.findall(r'[\u4e00-\u9fff]{2,5}', prompt)[:5]
        or ["研究主题", "分析方法"]
    )
    return json.dumps({
        "mode": "fallback",
        "reason": reason,
        "suggestion": f"请设置 DASHSCOPE_API_KEY 环境变量以启用 Qwen 大模型分析。当前为降级模式。",
        "note": f"检测到您关注的关键词: {keywords}",
        "setupGuide": "export DASHSCOPE_API_KEY=sk-xxxxx  # 从 https://dashscope.console.aliyun.com/ 获取",
    }, ensure_ascii=False)


# ═══════════════════════════════════════
# System Prompts（系统提示词）
# ═══════════════════════════════════════

SYSTEM_RESEARCH = """你是一位资深的数字人文和语料库语言学研究专家。
你精通以下领域：
- 语料库语言学：索引行分析、搭配分析、主题建模(LDA)、情感分析
- 数字人文：计算文学分析、文化分析学、远读(distant reading)
- 学术研究方法论：定量分析、定性分析、混合方法
- 中国文学与语言学：现代汉语、古典文献、翻译研究
- 文化研究：文化传播、文化政策、文化产业

在回答时：
1. 引用具体的研究方法名称
2. 提供可操作的研究步骤
3. 说明预期成果和学术贡献
4. 注意区分语料库方法和传统方法的优劣"""

SYSTEM_METHODOLOGY = """你是一位学术研究方法论专家，擅长设计严谨的学术实验。
你需要：
1. 明确研究问题和假设
2. 定义自变量、因变量和控制变量
3. 设计详细的实验步骤（包含具体方法）
4. 推荐合适的统计检验方法
5. 说明数据收集和分析流程
6. 推荐使用的工具和平台（Python/R/SPSS等）

以JSON格式输出，确保结构清晰、可直接用于研究方案。"""


# ═══════════════════════════════════════
# API 端点
# ═══════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": QWEN_MODEL,
        "apiConfigured": bool(QWEN_API_KEY),
        "timestamp": time.time(),
    })


# ── 1. 研究主题深度分析 ──
@app.route("/api/analyze-topic", methods=["POST"])
def analyze_topic():
    """
    分析用户输入的研究主题，返回：
    - 研究价值评估
    - 适合的研究方法建议
    - 与数字人文/语料库方法的契合点
    - 潜在研究难点
    - 推荐关键词
    """
    data = request.json or {}
    topic = data.get("topic", "")
    description = data.get("description", "")
    keywords = data.get("keywords", [])
    references = data.get("references", [])

    prompt = f"""请对以下研究主题进行深度学术分析：

研究标题：{topic}
研究描述：{description}
已有关键词：{", ".join(keywords) if keywords else "未提供"}
参考文献：{", ".join(ref.get("title", ref) if isinstance(ref, dict) else str(ref) for ref in references[:5]) if references else "未提供"}

请输出一个JSON对象，包含以下字段：
{{
  "research_value": "该研究的学术价值和创新性评估（200字）",
  "feasibility": "可行性分析，说明数据获取难度、方法成熟度等（100字）",
  "digital_humanities_fit": "该研究在数字人文和语料库方法框架下的契合度分析（150字）",
  "recommended_methods": ["方法1", "方法2", "方法3"],
  "suggested_keywords": ["关键词1", "关键词2", ...],
  "potential_difficulties": ["难点1", "难点2"],
  "expected_contributions": ["贡献1", "贡献2"]
}}

请严格按照JSON格式输出，确保字段完整。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 2. 文献综述生成 ──
@app.route("/api/generate-literature-review", methods=["POST"])
def generate_literature_review():
    """
    根据研究主题和已有参考文献，生成深度文献综述
    """
    data = request.json or {}
    topic = data.get("topic", "")
    references = data.get("references", [])
    existing_review = data.get("existingReview", "")

    ref_text = "\n".join(
        f"- {r.get('authors', ['未知作者'])[0] if isinstance(r.get('authors'), list) else '作者'} "
        f"({r.get('year', 'N/A')}). {r.get('title', 'N/A')}."
        f"{' ' + r.get('abstract', '')[:100] if r.get('abstract') else ''}"
        for r in references[:10]
    ) if references else "未提供具体参考文献"

    prompt = f"""请为以下研究主题撰写一篇深度文献综述：

研究主题：{topic}

当前已知文献：
{ref_text}

研究人员提供的已有综述：
{existing_review or "未提供已有综述"}

请输出一个JSON对象，包含以下字段：
{{
  "summary": "研究现状的总体概述（300-500字），说明该领域的发展脉络、主要研究方向和代表性成果",
  "key_findings": ["已有研究的主要发现1", "发现2", "发现3", "发现4"],
  "research_gaps": ["研究缺口1（具体说明哪些问题尚未被充分研究）", "缺口2", "缺口3"],
  "theoretical_framework": "适合本研究的理论框架（200-300字），需要关联语料库语言学、数字人文或相关学科的理论",
  "methodological_trends": ["该领域近年来的方法趋势1", "趋势2"],
  "key_scholars": ["该领域的重要学者和团队"]
}}

请确保内容学术严谨，引用具体的研究方法和理论概念。以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 3. 研究思路设计 ──
@app.route("/api/generate-research-ideas", methods=["POST"])
def generate_research_ideas():
    """
    生成多个可行的研究思路
    """
    data = request.json or {}
    topic = data.get("topic", "")
    review = data.get("literatureReview", {})
    keywords = data.get("keywords", [])

    prompt = f"""基于以下研究主题和文献综述，设计3个可行的研究思路：

研究主题：{topic}
关键词：{", ".join(keywords) if keywords else "未提供"}
文献综述摘要：{review.get("summary", "未提供") if isinstance(review, dict) else str(review)}
研究缺口：{review.get("research_gaps", []) if isinstance(review, dict) else "未提供"}

请输出一个JSON数组，每个元素包含：
[
  {{
    "title": "研究思路的标题（如：基于语料库的主题建模与演变分析）",
    "description": "详细描述该研究思路（150字）",
    "methodology": "具体的研究方法步骤（多行，每行一个步骤）",
    "expected_outcomes": "预期成果",
    "feasibility": "high/medium/low",
    "innovation": "创新点说明（100字）",
    "data_requirements": "数据需求和来源"
  }},
  ...
]

请确保3个研究思路分别从不同角度切入（如：语料库定量分析角度、数字人文方法论角度、跨学科整合角度）。
必须以JSON数组格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    ideas = result.get("results", []) if "results" in result else (
        result if isinstance(result, list) else []
    )
    return jsonify({"ideas": ideas, "raw": result})


# ── 4. 实验设计 ──
@app.route("/api/generate-experiment-design", methods=["POST"])
def generate_experiment_design():
    """
    生成完整的学术实验设计方案
    """
    data = request.json or {}
    topic = data.get("topic", "")
    research_idea = data.get("researchIdea", {})
    dataset_info = data.get("datasetInfo", "")

    idea_title = research_idea.get("title", "") if isinstance(research_idea, dict) else ""
    idea_method = research_idea.get("methodology", "") if isinstance(research_idea, dict) else ""

    prompt = f"""请为一个学术研究实验设计完整的实验方案。输出JSON格式：

研究主题：{topic}
研究思路：{idea_title}
研究方法：{idea_method}
数据集信息：{dataset_info or "待确定"}

请输出一个JSON对象，包含以下字段：
{{
  "experiment_type": "quantitative/qualitative/mixed",
  "title": "实验标题",
  "hypothesis": "研究假设",
  "variables": [
    {{"name": "变量名", "type": "independent/dependent/control", "description": "描述", "measurement": "测量方式"}}
  ],
  "procedure": [
    {{"order": 1, "title": "步骤标题", "description": "详细描述", "duration": "预计时间", "expected_output": "预期产出"}}
  ],
  "tools": ["工具1", "工具2"],
  "statistical_methods": ["统计方法1"],
  "validation_strategy": "验证策略说明",
  "expected_results": "预期结果描述"
}}

实验步骤至少5步，要具体可操作。工具列表包含Python、R、SPSS等具体工具。统计方法要结合研究设计的具体需求。
必须以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_METHODOLOGY)
    return jsonify(result)


# ── 5. 实验结果深度解读 ──
@app.route("/api/analyze-results", methods=["POST"])
def analyze_results():
    """
    对实验数据进行深度分析，包括统计解读和学术发现
    """
    data = request.json or {}
    experiment_title = data.get("experimentTitle", "")
    metrics = data.get("metrics", [])
    test_results = data.get("testResults", [])
    visual_insights = data.get("visualInsights", "")

    prompt = f"""请对以下实验结果进行深度分析和解读：

实验标题：{experiment_title}

核心指标：
{json.dumps(metrics, ensure_ascii=False, indent=2) if metrics else "未提供指标数据"}

统计检验结果：
{json.dumps(test_results, ensure_ascii=False, indent=2) if test_results else "未提供检验结果"}

可视化观察：
{visual_insights or "未提供可视化数据"}

请输出一个JSON对象：
{{
  "overall_assessment": "对实验结果的总体评价（150字）",
  "metrics_interpretation": [
    {{"metric": "指标名", "value": "数值", "significance": "统计或实际意义解读" }}
  ],
  "findings": [
    {{
      "title": "研究发现标题",
      "description": "详细发现描述（100字）",
      "confidence": "high/medium/low",
      "evidence": ["支撑证据1", "证据2"],
      "implications": "研究启示和意义（100字）"
    }}
  ],
  "limitations": ["研究局限性1", "局限性2"],
  "future_work": ["后续研究方向1", "方向2"]
}}

请确保解读基于数据，避免空洞的推测。发现不少于2条。
以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 6. 情感深度分析 ──
@app.route("/api/deep-sentiment-analysis", methods=["POST"])
def deep_sentiment_analysis():
    """
    使用大模型进行深度情感和态度分析（超越词典规则）
    """
    data = request.json or {}
    texts = data.get("texts", [])
    context = data.get("context", "")

    if isinstance(texts, str):
        texts = [texts]

    if not texts:
        return jsonify({"error": "请提供待分析文本"})

    text_block = "\n---\n".join(
        f"[文本{i+1}] {t[:300]}" for i, t in enumerate(texts[:10])
    )

    prompt = f"""请对以下文本进行深度情感和态度分析。注意：
- 不要仅依赖关键词，要理解文本的整体语义和语境
- 注意反讽、暗喻、程度修饰等复杂表达
- 区分"作者态度"和"文本中描述的情感"

语境说明：{context or "学术研究文本"}

待分析文本：
{text_block}

请输出一个JSON对象：
{{
  "overall_analysis": {{
    "dominant_sentiment": "总体情感倾向（positive/negative/neutral/mixed）",
    "sentiment_intensity": "0-1之间的情感强度",
    "summary": "总体情感特征概括（100字）"
  }},
  "per_text_analysis": [
    {{
      "text_index": 1,
      "sentiment": "positive/negative/neutral/mixed",
      "confidence": 0.0-1.0,
      "analysis": "具体情感分析说明（50字）",
      "key_phrases": ["关键情感短语1", "短语2"],
      "attitude_objects": [
        {{"object": "态度对象（如'研究方法'）", "attitude": "positive/negative/neutral", "intensity": 0.0-1.0}}
      ]
    }}
  ],
  "thematic_patterns": ["文本中反复出现的情感主题1", "主题2"]
}}

请以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 7. 深度语义/主题分析 ──
@app.route("/api/deep-semantic-analysis", methods=["POST"])
def deep_semantic_analysis():
    """
    使用大模型进行深度语义和主题分析
    """
    data = request.json or {}
    texts = data.get("texts", [])
    topic_count = data.get("topicCount", 5)

    if isinstance(texts, str):
        texts = [texts]

    if not texts:
        return jsonify({"error": "请提供待分析文本"})

    # 截取合适长度
    sample_texts = texts[:15]
    combined = " ".join(
        f"[文本{i+1}] {t[:200]}" for i, t in enumerate(sample_texts)
    )

    prompt = f"""请对以下文本集进行深度语义和主题分析。文本总量：{len(texts)}篇。

文本内容摘要：
{combined[:3000]}

请输出一个JSON对象：
{{
  "topics": [
    {{
      "id": 1,
      "label": "主题标签（简短的概括名称）",
      "description": "该主题的详细描述（50字）",
      "keywords": ["核心关键词1", "关键词2", "关键词3"],
      "coverage": "估计该主题覆盖文本的比例",
      "representative_phrases": ["代表性短语1", "短语2"]
    }}
  ],
  "semantic_relations": [
    {{
      "topic_a": "主题A标签",
      "topic_b": "主题B标签",
      "relation": "关联性描述（如：因果关系、对比关系、从属关系等）"
    }}
  ],
  "overall_themes": ["贯穿全文集的主要宏观主题1", "宏观主题2"],
  "vocabulary_characteristics": "词汇使用的整体特征描述"
}}

需要{topic_count}个主题。请以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 8. 关键词双向翻译 ──
@app.route("/api/translate-keywords", methods=["POST"])
def translate_keywords():
    """
    将关键词进行中⇄英双向翻译，用于跨语言文献检索：
    - 中文关键词 → 英文翻译
    - 英文关键词 → 中文翻译
    返回 translated: { original: translation } 字典
    """
    data = request.json or {}
    keywords = data.get("keywords", [])
    if not keywords:
        return jsonify({"translated": {}})

    kw_list = "\n".join(f"{i+1}. {kw}" for i, kw in enumerate(keywords))

    prompt = f"""请将以下学术关键词进行双向翻译（中文翻译为英文，英文翻译为中文），确保翻译准确、符合学术规范。

关键词列表：
{kw_list}

请输出一个JSON对象，格式为：
{{
  "translated": {{
    "原始关键词1": "翻译后的关键词1",
    "原始关键词2": "翻译后的关键词2"
  }}
}}

注意：
- 中文关键词翻译为英文时，使用学术领域通用的英文术语
- 英文关键词翻译为中文时，使用学术领域通用的中文术语
- 对于专有名词（如"语料库语言学"→"Corpus Linguistics"），需要保持专业准确性
- 多义词根据上下文选择最可能的学术含义
- 只输出JSON，不要有其他内容"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 9. 研究框架设计 ──
@app.route("/api/generate-research-framework", methods=["POST"])
def generate_research_framework():
    """
    基于文献综述中的研究缺口，设计完整的研究框架：
    - 具体研究问题
    - 理论模型/概念框架
    - 研究方法论路径
    - 预期创新点
    """
    data = request.json or {}
    topic = data.get("topic", "")
    review_summary = data.get("reviewSummary", "")
    research_gaps = data.get("researchGaps", [])
    keywords = data.get("keywords", [])

    gaps_text = "\n".join(f"{i+1}. {g}" for i, g in enumerate(research_gaps)) if research_gaps else "待从综述中提取"

    prompt = f"""请基于以下文献综述的研究缺口，为"{topic}"设计一个完整的研究框架。

文献综述要点：{review_summary[:500]}
研究缺口：
{gaps_text}
关键词：{", ".join(keywords) if keywords else "未提供"}

请输出一个JSON对象：
{{
  "research_title": "精炼后的研究标题（有学术感，20字以内）",
  "research_questions": ["具体研究问题1（要有可操作性）", "问题2", "问题3"],
  "theoretical_model": "理论框架或概念模型描述（200字），说明核心概念之间的关系",
  "methodology_overview": "研究方法论总体描述（150字），包括研究范式、数据类型、分析策略",
  "innovation_points": ["创新点1（具体说明与已有研究的不同）", "创新点2", "创新点3"],
  "expected_academic_contribution": "预期学术贡献（100字）",
  "feasibility_assessment": "可行性评估（100字）"
}}

请确保研究问题具体可操作、理论框架有学术依据、创新点确实区别于已有研究。以JSON格式输出。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ── 10. 自然语言 → CQP 查询转换 ──
@app.route("/api/nl-to-cqp", methods=["POST"])
def nl_to_cqp():
    """
    将用户的自然语言检索需求转换为 CQP 语料库查询语句。
    支持：
    - 词汇检索 → word 查询
    - 正则模式 → regex 查询
    - 短语/共现 → phrase/regex 查询
    - 搭配分析 → collocation 查询
    """
    data = request.json or {}
    nl_query = data.get("query", "").strip()
    if not nl_query:
        return jsonify({"error": "查询不能为空"}), 400

    prompt = f"""你是CQP (Corpus Query Processor) 查询专家。请将用户的自然语言检索需求转换为结构化的语料库查询参数。

用户查询："{nl_query}"

语料库信息：本地中文古典小说语料库，包含《西游记》《红楼梦》《三国演义》等古典名著，采用UTF-8编码纯文本。

请分析用户的意图，输出一个JSON对象：
{{
  "intent": "用户意图描述（10字以内）",
  "searchType": "word|regex|phrase|collocation",
  "query": "转换后的查询词/正则表达式",
  "contextSize": 上下文窗口大小（中文字符数，默认30），
  "explanation": "对转换逻辑的简短说明"
}}

规则：
1. 如果用户要查找某个词/字的出现位置 → searchType="word", query=那个词（如"孙悟空"→query="孙悟空"）
2. 如果用户描述了一个模式（如"以...开头的句子"、"包含A和B的段落"） → searchType="regex", query=对应的正则表达式（如查找包含"师徒"和"妖怪"的段落→query="师徒.*妖怪|妖怪.*师徒"）
3. 如果用户想找A词周围N个字内的B词 → searchType="phrase" 或 "regex"
4. 如果用户想分析某个词的搭配 → searchType="collocation"
5. 正则表达式要实用，用Python re模块支持的语法
6. query必须是纯文本或正则表达式，不要带引号
7. 如果用户只是问某个词出现几次，contextSize可以设小一点（如10）
8. 如果需要看完整句子，contextSize设为30-50

只输出JSON，不要有其他内容。"""

    result = call_qwen_json(prompt, SYSTEM_RESEARCH)
    return jsonify(result)


# ═══════════════════════════════════════
# 启动入口
# ═══════════════════════════════════════

if __name__ == "__main__":
    print("=" * 50)
    print("  Qwen LLM 学术分析服务")
    print(f"  模型: {QWEN_MODEL}")
    print(f"  API配置: {'已配置' if QWEN_API_KEY else '⚠ 未配置 (降级模式)'}")
    print(f"  健康检查: http://0.0.0.0:5000/api/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=False)
