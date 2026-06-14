"""
语料库分析 MCP Server
提供索引行、搭配分析、主题建模、情感分析等语料库研究工具

协议: MCP (Model Context Protocol)
传输: stdio
"""

import json
import math
import asyncio
from collections import Counter, defaultdict
from typing import Any, Sequence

import jieba
import jieba.analyse
import numpy as np
from scipy.stats import chi2_contingency

# ── jieba 兼容层 ──
from jieba_compat import lcut as jieba_lcut, lcut_for_search as jieba_lcut_for_search

# ── MCP Server ──
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
from mcp.server.stdio import stdio_server

# ── 初始化 jieba ──
jieba.setLogLevel(20)  # 关闭 jieba 的 debug 日志

server = Server("corpus-analyzer")

# ════════════════════════════════════════════════
# 内部语料库（可扩展为加载外部文件）
# ════════════════════════════════════════════════

_BUILTIN_CORPUS = {
    "demo_zh": {
        "name": "中文示例语料库",
        "texts": [
            "数字人文为传统文化研究提供了新的方法和视角，具有重要的学术价值。",
            "语料库语言学方法能够有效揭示大规模文本中的语言使用规律。",
            "基于语料库的中国现当代文学主题演变研究具有重要的学术意义。",
            "然而当前数字人文研究仍面临数据质量不高、方法不统一等挑战。",
            "机器翻译在文学作品中仍无法完全替代人工翻译的精确性。",
            "跨文化交流日益频繁，语言接触对词汇演变产生了深远影响。",
            "文化传承与创新是当代社会发展的重要议题，需要多方共同努力。",
            "中国传统文化的现代转型面临着机遇与挑战并存的局面。",
            "大数据技术为社会科学研究提供了全新的分析范式和研究工具。",
            "非物质文化遗产保护工作取得了显著进展，但仍需持续投入。",
            "多元文化融合是全球化时代的显著特征，促进了文明互鉴。",
            "网络文化现象引发了学者们的广泛关注和深入研究。",
            "地域文化差异对语言使用习惯有着不可忽视的深刻影响。",
            "文化产业正在成为国民经济的重要支柱产业之一。",
            "语言资源保护对于维护文化多样性具有战略意义。",
            "数字化技术为古籍保护与利用开辟了全新的可能路径。",
            "语料库方法使得研究者能够从大规模文本中发现潜在模式。",
            "情感分析和语义分析为文本解读提供了全新的分析维度。",
            "人文社科研究正经历着从传统范式向数据驱动范式的转变。",
            "学术交流的国际化为知识传播和创新发展创造了有利条件。",
            "文化自信是一个国家和民族发展中更基本更深沉更持久的力量。",
            "数字技术的发展正深刻改变着人文学科的研究方式和方法论。",
            "语料库建设是语言研究和自然语言处理的重要基础设施工作。",
            "文学作品中蕴含着丰富的社会历史信息和人文精神内涵。",
            "统计分析在语言学研究中的应用日益广泛，推动了方法创新。",
        ],
    }
}


def tokenize(text: str) -> list[str]:
    """中文分词，过滤停用词和标点"""
    words = jieba_lcut(text)
    # 过滤单字词和纯标点
    stop_chars = set("，。！？、；：""''（）【】《》…—·　 \t\n\r")
    return [
        w for w in words
        if len(w) > 1 or (len(w) == 1 and '\u4e00' <= w <= '\u9fff')
        if w not in stop_chars
    ]


# ════════════════════════════════════════════════
# 工具实现
# ════════════════════════════════════════════════

async def concordance_search(
    query: str,
    corpus_name: str = "demo_zh",
    window_size: int = 5,
    max_results: int = 50,
) -> str:
    """
    KWIC 索引行检索 - 搜索关键词在语料中的上下文
    
    参数:
        query: 检索词
        corpus_name: 语料库名称
        window_size: 左右窗口大小（字符数）
        max_results: 最大返回结果数
    """
    corpus = _BUILTIN_CORPUS.get(corpus_name)
    if not corpus:
        return json.dumps({"error": f"语料库 '{corpus_name}' 不存在"}, ensure_ascii=False)
    
    results = []
    for line_num, text in enumerate(corpus["texts"], 1):
        idx = text.find(query)
        while idx != -1 and len(results) < max_results:
            # 向左取窗口
            left_start = max(0, idx - window_size)
            left = text[left_start:idx]
            # 向右取窗口
            right_end = min(len(text), idx + len(query) + window_size)
            right = text[idx + len(query):right_end]
            
            results.append({
                "line": line_num,
                "node": query,
                "leftContext": left,
                "rightContext": right,
                "fullText": text,
                "position": idx,
            })
            idx = text.find(query, idx + 1)
    
    return json.dumps({
        "query": query,
        "corpus": corpus["name"],
        "totalHits": len(results),
        "results": results,
        "message": f"在语料库 '{corpus['name']}' 中搜索 '{query}'，共找到 {len(results)} 条结果",
    }, ensure_ascii=False, indent=2)


async def collocation_analysis(
    node_word: str,
    corpus_name: str = "demo_zh",
    left_span: int = 5,
    right_span: int = 5,
    min_freq: int = 1,
    top_n: int = 20,
) -> str:
    """
    搭配分析 - 计算 MI值、T值、LogDice 等搭配统计量
    
    参数:
        node_word: 节点词
        corpus_name: 语料库名称
        left_span: 左跨距
        right_span: 右跨距
        min_freq: 最小共现频次
        top_n: 返回前N个搭配词
    """
    corpus = _BUILTIN_CORPUS.get(corpus_name)
    if not corpus:
        return json.dumps({"error": f"语料库 '{corpus_name}' 不存在"}, ensure_ascii=False)
    
    # 构建所有词的位置索引
    all_tokens = []
    token_positions = defaultdict(list)  # word -> list of (text_idx, position)
    collocate_counts = defaultdict(lambda: {"left": 0, "right": 0})
    node_count = 0
    
    for text_idx, text in enumerate(corpus["texts"]):
        tokens = tokenize(text)
        all_tokens.append(tokens)
        for pos, token in enumerate(tokens):
            token_positions[token].append((text_idx, pos))
    
    # 统计共现
    node_positions = token_positions.get(node_word, [])
    node_count = len(node_positions)
    
    if node_count == 0:
        return json.dumps({
            "error": f"节点词 '{node_word}' 在语料库中未找到",
            "nodeWord": node_word,
            "corpus": corpus["name"],
        }, ensure_ascii=False)
    
    total_tokens = sum(len(tokens) for tokens in all_tokens)
    
    for text_idx, pos in node_positions:
        tokens = all_tokens[text_idx]
        # 左侧搭配词
        for d in range(1, left_span + 1):
            if pos - d >= 0:
                collocate = tokens[pos - d]
                collocate_counts[collocate]["left"] += 1
                collocate_counts[collocate]["_distance"] = d
        # 右侧搭配词
        for d in range(1, right_span + 1):
            if pos + d < len(tokens):
                collocate = tokens[pos + d]
                collocate_counts[collocate]["right"] += 1
                collocate_counts[collocate]["_distance"] = -d
    
    # 计算 MI, T-score, LogDice
    results = []
    for word, counts in collocate_counts.items():
        freq = counts["left"] + counts["right"]
        if freq < min_freq or word == node_word:
            continue
        
        collocate_total = len(token_positions[word])
        
        # MI = log2(observed / expected)
        # observed = co-occurrence frequency
        # expected = (node_freq * collocate_freq) / total_tokens
        observed = freq
        expected = (node_count * collocate_total) / total_tokens if total_tokens > 0 else 0
        mi = math.log2(observed / expected) if expected > 0 and observed > 0 else 0
        
        # T-score = (observed - expected) / sqrt(observed)
        t_score = (observed - expected) / math.sqrt(observed) if observed > 0 else 0
        
        # LogDice = 14 + log2(2 * observed / (node_count + collocate_total))
        denominator = node_count + collocate_total
        log_dice = 14 + math.log2(2 * observed / denominator) if denominator > 0 else 0
        
        # 确定主要位置
        position = "left" if counts["left"] >= counts["right"] else "right"
        
        results.append({
            "word": word,
            "frequency": freq,
            "mi": round(mi, 3),
            "tScore": round(t_score, 3),
            "logDice": round(log_dice, 3),
            "position": position,
            "distance": abs(counts["_distance"]),
            "leftCount": counts["left"],
            "rightCount": counts["right"],
        })
    
    # 按 MI 排序取 top_n
    results.sort(key=lambda x: x["mi"], reverse=True)
    top_results = results[:top_n]
    
    return json.dumps({
        "nodeWord": node_word,
        "corpus": corpus["name"],
        "totalTokens": total_tokens,
        "nodeFrequency": node_count,
        "spanInfo": {"left": left_span, "right": right_span},
        "collocates": top_results,
        "totalCollocates": len(results),
        "message": f"节点词 '{node_word}' 在语料中出现了 {node_count} 次，找到 {len(results)} 个搭配词",
    }, ensure_ascii=False, indent=2)


async def topic_modeling(
    corpus_name: str = "demo_zh",
    num_topics: int = 5,
    passes: int = 5,
) -> str:
    """
    主题建模 - 使用 LDA 提取主题分布
    
    参数:
        corpus_name: 语料库名称
        num_topics: 主题数量
        passes: LDA 训练轮数
    """
    try:
        from gensim import corpora, models
        GENSIM_AVAILABLE = True
    except ImportError:
        GENSIM_AVAILABLE = False
    
    corpus = _BUILTIN_CORPUS.get(corpus_name)
    if not corpus:
        return json.dumps({"error": f"语料库 '{corpus_name}' 不存在"}, ensure_ascii=False)
    
    # 分词
    texts = corpus["texts"]
    tokenized = [tokenize(t) for t in texts]
    
    if not GENSIM_AVAILABLE:
        # 降级方案：使用 TF-IDF 关键词提取
        import jieba.analyse
        all_words = []
        for tokens in tokenized:
            all_words.extend(tokens)
        
        # 聚合文本进行主题相关的关键词抽取
        combined_text = " ".join([" ".join(t) for t in tokenized])
        tfidf_keywords = jieba.analyse.extract_tags(
            combined_text, topK=num_topics * 5, withWeight=True
        )
        
        # 简单分组模拟主题
        chunk_size = max(1, len(tfidf_keywords) // num_topics)
        topics = []
        for i in range(num_topics):
            start = i * chunk_size
            end = start + chunk_size if i < num_topics - 1 else len(tfidf_keywords)
            chunk = tfidf_keywords[start:end]
            topics.append({
                "topicId": i + 1,
                "topicLabel": f"主题{i+1}",
                "keywords": [w for w, _ in chunk[:5]],
                "weight": round(sum(s for _, s in chunk) / max(1, sum(s for _, s in tfidf_keywords)), 4),
                "keywordWeights": [{"word": w, "weight": round(s, 4)} for w, s in chunk],
            })
        
        return json.dumps({
            "method": "TF-IDF关键词聚类（降级方案，请安装 gensim 获得完整 LDA 支持）",
            "corpus": corpus["name"],
            "numTopics": num_topics,
            "numDocuments": len(texts),
            "topics": topics,
        }, ensure_ascii=False, indent=2)
    
    # ── 完整 LDA 流程 ──
    # 构建词典和语料
    dictionary = corpora.Dictionary(tokenized)
    dictionary.filter_extremes(no_below=1, no_above=0.9)
    bow_corpus = [dictionary.doc2bow(t) for t in tokenized]
    
    # 训练 LDA 模型
    lda_model = models.LdaModel(
        bow_corpus,
        num_topics=num_topics,
        id2word=dictionary,
        passes=passes,
        random_state=42,
    )
    
    # 提取主题
    topics = []
    for topic_id in range(num_topics):
        topic_terms = lda_model.show_topic(topic_id, topn=8)
        topics.append({
            "topicId": topic_id + 1,
            "topicLabel": f"主题{topic_id + 1}",
            "keywords": [term for term, _ in topic_terms],
            "keywordWeights": [{"word": term, "weight": round(weight, 4)} for term, weight in topic_terms],
        })
    
    # 计算每个主题的文档分布
    doc_topics = []
    for doc_bow in bow_corpus:
        doc_dist = lda_model.get_document_topics(doc_bow, minimum_probability=0.01)
        dominant_topic = max(doc_dist, key=lambda x: x[1]) if doc_dist else (-1, 0)
        doc_topics.append({
            "dominantTopic": dominant_topic[0],
            "probability": round(dominant_topic[1], 4),
            "distribution": [{"topic": t, "prob": round(p, 4)} for t, p in doc_dist],
        })
    
    return json.dumps({
        "method": "LDA (Latent Dirichlet Allocation)",
        "corpus": corpus["name"],
        "numTopics": num_topics,
        "numDocuments": len(texts),
        "dictionarySize": len(dictionary),
        "parameters": {"passes": passes, "alpha": "auto", "eta": "auto"},
        "topics": topics,
        "documentTopics": doc_topics,
        "coherence": "可用 c_v 一致性（需额外计算）",
    }, ensure_ascii=False, indent=2)


# ── 基础中文情感词典 ──
_POSITIVE_WORDS = {
    "优秀", "成功", "显著", "重要", "积极", "进步", "创新",
    "发展", "贡献", "价值", "有效", "提升", "增强", "促进",
    "优化", "推进", "完善", "丰富", "深入", "广泛", "先进",
    "卓越", "突破", "领先", "繁荣", "和谐", "自信", "自信",
    "保护", "传承", "保护", "支持", "认可", "推广", "普及",
}

_NEGATIVE_WORDS = {
    "问题", "挑战", "困难", "不足", "限制", "缺乏", "落后",
    "忽视", "损失", "下降", "削弱", "阻碍", "破坏", "矛盾",
    "压力", "风险", "危机", "分歧", "争议", "缺陷", "偏差",
    "误区", "困境", "负担", "消极", "衰退", "退化", "恶化",
}

_DEGREE_WORDS = {
    "非常": 2.0, "十分": 2.0, "极其": 2.5, "特别": 1.8,
    "很": 1.5, "较": 1.2, "稍微": 0.8, "略": 0.7,
    "更加": 1.6, "更为": 1.6, "尤其": 1.8, "相当": 1.3,
    "完全": 1.5, "彻底": 1.8, "深深": 1.5,
}

_NEGATION_WORDS = {"不", "没", "无", "非", "未", "别", "勿", "否"}


def analyze_single_sentiment(text: str) -> dict:
    """对单段文本进行情感分析"""
    words = jieba_lcut(text)
    
    score = 0.0
    positive_count = 0
    negative_count = 0
    aspects = {}
    current_aspect = "整体"
    
    # 情感修饰状态
    negated = False
    degree = 1.0
    
    for i, word in enumerate(words):
        if word in _NEGATION_WORDS:
            negated = True
            continue
        
        if word in _DEGREE_WORDS:
            degree = _DEGREE_WORDS[word]
            continue
        
        if word in _POSITIVE_WORDS:
            val = 1.0 * degree
            if negated:
                val = -val
                negative_count += 1
            else:
                positive_count += 1
            score += val
            aspects[current_aspect] = aspects.get(current_aspect, 0) + val
            negated = False
            degree = 1.0
        elif word in _NEGATIVE_WORDS:
            val = -1.0 * degree
            if negated:
                val = -val  # 双重否定 = 肯定
                positive_count += 1
            else:
                negative_count += 1
            score += val
            aspects[current_aspect] = aspects.get(current_aspect, 0) + val
            negated = False
            degree = 1.0
    
    # 归一化
    max_score = 10.0
    normalized = max(-1.0, min(1.0, score / max_score))
    
    if normalized > 0.1:
        sentiment = "positive"
    elif normalized < -0.1:
        sentiment = "negative"
    elif positive_count > 0 or negative_count > 0:
        sentiment = "mixed"
    else:
        sentiment = "neutral"
    
    aspect_list = [
        {"aspect": a, "sentiment": "positive" if s > 0 else "negative" if s < 0 else "neutral", "score": round(s, 3)}
        for a, s in aspects.items()
    ]
    
    return {
        "text": text[:100] + ("..." if len(text) > 100 else ""),
        "sentiment": sentiment,
        "score": round(normalized, 4),
        "positiveWords": positive_count,
        "negativeWords": negative_count,
        "aspects": aspect_list,
        "confidence": round(min(0.95, (abs(normalized) * 0.8 + 0.15)), 4),
    }


async def sentiment_analysis(
    texts: str | list[str],
    corpus_name: str = "demo_zh",
) -> str:
    """
    情感态度分析 - 分析文本的情感极性和态度倾向
    
    参数:
        texts: 待分析文本（字符串或文本列表），如果为 "corpus" 则使用整个语料库
        corpus_name: 语料库名称
    """
    corpus = _BUILTIN_CORPUS.get(corpus_name)
    
    if texts == "corpus":
        if not corpus:
            return json.dumps({"error": f"语料库 '{corpus_name}' 不存在"}, ensure_ascii=False)
        text_list = corpus["texts"]
    elif isinstance(texts, str):
        # 按句号/换行分句
        text_list = [t.strip() for t in texts.replace("。", "。\n").split("\n") if t.strip()]
        if len(text_list) == 1:
            text_list = jieba.lcut(texts)  # fallback
            text_list = [texts]
    else:
        text_list = texts
    
    results = [analyze_single_sentiment(t) for t in text_list]
    
    # 汇总统计
    pos_count = sum(1 for r in results if r["sentiment"] == "positive")
    neg_count = sum(1 for r in results if r["sentiment"] == "negative")
    neu_count = sum(1 for r in results if r["sentiment"] == "neutral")
    mix_count = sum(1 for r in results if r["sentiment"] == "mixed")
    avg_score = sum(r["score"] for r in results) / len(results) if results else 0
    
    return json.dumps({
        "overallSentiment": {
            "positive": pos_count,
            "negative": neg_count,
            "neutral": neu_count,
            "mixed": mix_count,
            "averageScore": round(avg_score, 4),
        },
        "totalTexts": len(results),
        "lexicon": "内置中文情感词典 + 程度词 + 否定词检测",
        "results": results,
    }, ensure_ascii=False, indent=2)


async def text_preprocessing(
    text: str,
    remove_stopwords: bool = True,
    extract_keywords: bool = False,
) -> str:
    """
    文本预处理 - 分词、词性标注、关键词提取
    
    参数:
        text: 输入文本
        remove_stopwords: 是否过滤停用词
        extract_keywords: 是否提取关键词
    """
    import jieba.posseg as pseg
    
    # 分词 + 词性标注
    words_with_pos = [(w, f) for w, f in pseg.cut(text)]
    tokens = [w for w, _ in words_with_pos]
    
    # 统计
    word_freq = Counter(w for w, f in words_with_pos if len(w) > 1)
    
    result = {
        "originalLength": len(text),
        "tokenCount": len(tokens),
        "uniqueTokens": len(set(tokens)),
        "tokens": tokens,
        "posTagged": [{"word": w, "pos": f} for w, f in words_with_pos],
        "wordFrequency": dict(word_freq.most_common(20)),
    }
    
    if extract_keywords:
        keywords = jieba.analyse.extract_tags(text, topK=15, withWeight=True)
        result["keywords"] = [
            {"word": w, "weight": round(s, 4)} for w, s in keywords
        ]
    
    return json.dumps(result, ensure_ascii=False, indent=2)


# ════════════════════════════════════════════════
# MCP 工具注册
# ════════════════════════════════════════════════

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="concordance_search",
            description="KWIC索引行检索 - 搜索关键词在语料库中的上下文。支持中文分词检索，返回关键词的左右语境。",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "检索词"},
                    "corpus_name": {"type": "string", "description": "语料库名称，默认: demo_zh", "default": "demo_zh"},
                    "window_size": {"type": "integer", "description": "左右窗口大小（字符数），默认: 5", "default": 5},
                    "max_results": {"type": "integer", "description": "最大结果数，默认: 50", "default": 50},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="collocation_analysis",
            description="搭配分析 - 计算节点词的搭配词统计量（MI值、T值、LogDice），返回显著搭配词列表。",
            inputSchema={
                "type": "object",
                "properties": {
                    "node_word": {"type": "string", "description": "节点词"},
                    "corpus_name": {"type": "string", "description": "语料库名称", "default": "demo_zh"},
                    "left_span": {"type": "integer", "description": "左跨距", "default": 5},
                    "right_span": {"type": "integer", "description": "右跨距", "default": 5},
                    "min_freq": {"type": "integer", "description": "最小共现频次", "default": 1},
                    "top_n": {"type": "integer", "description": "返回前N个结果", "default": 20},
                },
                "required": ["node_word"],
            },
        ),
        Tool(
            name="topic_modeling",
            description="主题语义建模 - 使用LDA或TF-IDF提取语料库的主题分布和关键词。",
            inputSchema={
                "type": "object",
                "properties": {
                    "corpus_name": {"type": "string", "description": "语料库名称", "default": "demo_zh"},
                    "num_topics": {"type": "integer", "description": "主题数量", "default": 5},
                    "passes": {"type": "integer", "description": "LDA训练轮数", "default": 5},
                },
            },
        ),
        Tool(
            name="sentiment_analysis",
            description="情感态度分析 - 分析中文文本的情感极性（正面/负面/中性/混合）和态度倾向。",
            inputSchema={
                "type": "object",
                "properties": {
                    "texts": {
                        "type": "string",
                        "description": "待分析文本，可以是单段文本或 'corpus'（使用整个语料库）",
                    },
                    "corpus_name": {"type": "string", "description": "语料库名称", "default": "demo_zh"},
                },
                "required": ["texts"],
            },
        ),
        Tool(
            name="text_preprocessing",
            description="文本预处理 - 中文分词、词性标注、关键词提取。",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "输入文本"},
                    "remove_stopwords": {"type": "boolean", "description": "是否过滤停用词", "default": True},
                    "extract_keywords": {"type": "boolean", "description": "是否提取TF-IDF关键词", "default": False},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="list_corpora",
            description="列出可用的语料库及其基本信息。",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "concordance_search":
            result = await concordance_search(
                query=arguments["query"],
                corpus_name=arguments.get("corpus_name", "demo_zh"),
                window_size=arguments.get("window_size", 5),
                max_results=arguments.get("max_results", 50),
            )
        elif name == "collocation_analysis":
            result = await collocation_analysis(
                node_word=arguments["node_word"],
                corpus_name=arguments.get("corpus_name", "demo_zh"),
                left_span=arguments.get("left_span", 5),
                right_span=arguments.get("right_span", 5),
                min_freq=arguments.get("min_freq", 1),
                top_n=arguments.get("top_n", 20),
            )
        elif name == "topic_modeling":
            result = await topic_modeling(
                corpus_name=arguments.get("corpus_name", "demo_zh"),
                num_topics=arguments.get("num_topics", 5),
                passes=arguments.get("passes", 5),
            )
        elif name == "sentiment_analysis":
            result = await sentiment_analysis(
                texts=arguments["texts"],
                corpus_name=arguments.get("corpus_name", "demo_zh"),
            )
        elif name == "text_preprocessing":
            result = await text_preprocessing(
                text=arguments["text"],
                remove_stopwords=arguments.get("remove_stopwords", True),
                extract_keywords=arguments.get("extract_keywords", False),
            )
        elif name == "list_corpora":
            corpora_info = {
                k: {"name": v["name"], "textCount": len(v["texts"])}
                for k, v in _BUILTIN_CORPUS.items()
            }
            result = json.dumps({
                "corpora": corpora_info,
                "availableTools": [
                    "concordance_search", "collocation_analysis",
                    "topic_modeling", "sentiment_analysis", "text_preprocessing",
                ],
            }, ensure_ascii=False, indent=2)
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]
        
        return [TextContent(type="text", text=result)]
    
    except Exception as e:
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e), "tool": name}, ensure_ascii=False)
        )]


# ════════════════════════════════════════════════
# 主入口
# ════════════════════════════════════════════════

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
