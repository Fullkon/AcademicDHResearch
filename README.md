# 学术研究智能体 — 语料库与数字人文

> An intelligent academic research agent for corpus linguistics and digital humanities, powered by **Qwen LLM**, real literature APIs, and a local **CQP corpus query engine**.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178c6.svg)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/python-3.6%2B-3776ab.svg)](https://python.org)

**Online demo** → [http://8.219.110.163:8080](http://8.219.110.163:8080)

---

## 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [五步研究流程](#五步研究流程)
- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [后端 API 一览](#后端-api-一览)
- [语料库资源](#语料库资源)
- [项目结构](#项目结构)
- [License](#license)

---

## 项目概述

**学术研究智能体** 是一个面向语料库语言学与数字人文方向的 React 全栈应用。它整合了 **Qwen 大模型** 的深度学术分析能力与 **真实的文献/语料检索接口**，为用户提供从选题到实验完成的**端到端学术研究辅助**。

用户只需输入大致研究方向，系统即可自动完成：

1. **选题分析** — Qwen 大模型评估研究价值与可行性
2. **文献检索** — 跨语言（中英双向翻译）检索 OpenAlex + Semantic Scholar 真实文献库
3. **文献综述** — Qwen 大模型基于选定的文献生成结构化学术综述
4. **研究框架** — Qwen 基于综述中的研究缺口，设计理论模型与研究方法
5. **实验设计** — Qwen 生成完整的实验方案（假设、变量、步骤、统计方法）

同时支持**独立的语料库 CQP 检索模块**：用户可用自然语言描述需求，Qwen 自动转换为 CQP 查询语句，检索本地 338 篇/3800 万字的中国古典小说语料库。

---

## 核心功能

| 模块 | 功能 | 实现方式 |
|------|------|----------|
| ? **研究选题** | 5步学术流程：选题分析→文献检索→文献综述→研究框架→实验设计 | Qwen LLM + OpenAlex + Semantic Scholar |
| ? **文献检索** | 中英双语翻译 + 跨库联合检索 | Qwen 翻译 → OpenAlex + Semantic Scholar API |
| ? **语料库 CQP** | 自然语言→CQP 查询，KWIC 索引行、搭配分析 | Qwen NL→CQP + 本地 CQP 引擎 (5001端口) |
| ?? **主题语义** | LDA 主题建模 | Jieba + Gensim |
| ?? **情感态度** | 情感极性分析 | SnowNLP |
| ?? **地图检索** | 地名地理编码 | OpenStreetMap Nominatim API |
| ? **统计年鉴** | 统计数据查询 | World Bank API |
| ? **实验设计** | LLM 生成实验方案 | Qwen LLM |
| ? **结果分析** | 实验指标解读、发现总结 | Qwen LLM |

---

## 五步研究流程

```
用户输入研究方向
       │
  ┌────▼─────────────────────────────────────────────┐
  │ Step 1 · 选题分析                                │
  │ Qwen 分析研究价值、可行性、数字人文契合度、      │
  │ 推荐研究方法与关键词                              │
  └────┬─────────────────────────────────────────────┘
       │
  ┌────▼─────────────────────────────────────────────┐
  │ Step 2 · 文献检索                                │
  │ Qwen 中英双向翻译关键词 → 并行检索               │
  │ OpenAlex (中英文) + Semantic Scholar (英文)       │
  │ 用户勾选相关文献，支持全选/单选                   │
  └────┬─────────────────────────────────────────────┘
       │
  ┌────▼─────────────────────────────────────────────┐
  │ Step 3 · 文献综述                                │
  │ Qwen 基于已选文献的 title/author/abstract         │
  │ 生成结构化综述、已有发现、研究缺口、理论框架      │
  └────┬─────────────────────────────────────────────┘
       │
  ┌────▼─────────────────────────────────────────────┐
  │ Step 4 · 研究框架                                │
  │ Qwen 基于研究缺口 → 研究问题、理论模型、         │
  │ 方法论路径、创新点、学术贡献                      │
  └────┬─────────────────────────────────────────────┘
       │
  ┌────▼─────────────────────────────────────────────┐
  │ Step 5 · 实验设计                                │
  │ Qwen 生成研究假设、变量定义、实验步骤、          │
  │ 使用工具、统计方法 → 进入实验执行                │
  └──────────────────────────────────────────────────┘
```

### 语料库 CQP 检索流程

```
用户自然语言输入
（如："查找孙悟空和猪八戒同时出现的句子"）
       │
       ▼
  Qwen NL→CQP 转换 (/api/nl-to-cqp)
  → { searchType: "regex", query: "孙悟空.*猪八戒|猪八戒.*孙悟空" }
       │
       ▼
  CQP 查询引擎 (/api/cqp/search)
  → 遍历 338 篇古典小说 → KWIC 索引行结果
```

---

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│               http://8.219.110.163:8080                  │
└────────────┬────────────────────┬───────────────────────┘
             │                    │
             │  /api/*            │  /api/cqp/*
             ▼                    ▼
┌─────────────────────┐  ┌──────────────────────────┐
│  Nginx (8080)       │  │  静态文件 (Vite Build)     │
│  反向代理 + Gzip    │  │  /var/www/academic-research/│
└─────────┬───────────┘  └──────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐  ┌──────────────┐
│ Qwen    │  │  CQP Engine  │
│ :5000   │  │  :5001       │
│ (Flask) │  │  (Flask)     │
│         │  │              │
│ ? 选题分析│  │ ? KWIC 检索  │
│ ? 文献综述│  │ ? 搭配分析  │
│ ? 研究框架│  │ ? 338篇语料  │
│ ? 实验设计│  │  3800万字    │
│ ? NL→CQP │  │              │
│ ? 关键词翻译│ │              │
└────┬────┘  └──────────────┘
     │
     ▼
  ┌──────────────┐
  │ Qwen API     │
  │ (DashScope)  │
  └──────────────┘
```

### 后端微服务

| 服务 | 端口 | 技术栈 | 描述 |
|------|------|--------|------|
| **qwen-llm** | 5000 | Python Flask + Gunicorn | Qwen 大模型学术分析 (7个端点) |
| **cqp-search** | 5001 | Python Flask + Gunicorn | 本地 CQP 语料库查询引擎 |
| **corpus-analyzer** | (MCP stdio) | Python + Jieba + Gensim | 语料库分析 (索引行、搭配、主题、情感) |
| **literature-search** | (MCP stdio) | Python + httpx | 英文学术文献检索 (Semantic Scholar + CrossRef) |
| **cnki-scraper** | (MCP stdio) | Python + httpx | 中文学术文献检索 (OpenAlex + 百度学术) |
| **statistics-search** | (MCP stdio) | Python + httpx | 统计年鉴与地图查询 |

---

## 技术栈

### 前端

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 图表 | Recharts |
| 图标 | Lucide React |
| 流程图 | React Flow |

### 后端 (Python)

| 类别 | 技术 |
|------|------|
| Web 框架 | Flask + Flask-CORS |
| WSGI 服务器 | Gunicorn |
| 中文 NLP | Jieba (分词) + SnowNLP (情感) |
| 主题建模 | Gensim (LDA) |
| HTTP 客户端 | httpx / urllib |
| LLM API | Qwen-PLUS (DashScope) |

### 外部 API

| API | 用途 |
|-----|------|
| **Qwen / DashScope** | LLM 深度分析（选题、综述、框架、实验设计、NL→CQP 转换、关键词翻译） |
| **OpenAlex** | 开放学术知识图谱，2.5亿+学术作品 (含中文文献) |
| **Semantic Scholar** | 英文学术文献检索，2亿+论文 |
| **World Bank** | 统计与发展指标数据 |
| **OpenStreetMap Nominatim** | 地名地理编码 |

---

## 快速开始

### 环境要求

- **Node.js** ≥ 18.x
- **Python** ≥ 3.6
- **pip** (Python 包管理器)

### 1. 克隆项目

```bash
git clone https://github.com/Fullkon/AcademicDHResearch.git
cd AcademicDHResearch
```

### 2. 安装依赖

**Windows (一键安装):**

```bash
setup.bat
```

**手动安装:**

```bash
# 前端依赖
npm install

# Python 后端依赖
pip install -q flask flask-cors gunicorn jieba gensim scikit-learn scipy nltk snownlp httpx aiohttp numpy pandas
```

### 3. 启动开发

```bash
# 启动前端开发服务器 (http://localhost:3000)
npm run dev

# 启动 Qwen LLM 服务 (端口 5000)
cd mcp-servers/qwen-llm
python server.py

# 启动 CQP 查询引擎 (端口 5001)
cd mcp-servers/cqp-search
python server.py
```

### 4. 配置 Qwen API Key

```bash
export DASHSCOPE_API_KEY="sk-your-api-key"
```

如果不设置 API Key，系统会自动降级为本地规则模式。

---

## 部署指南

### 生产部署 (Nginx + systemd)

本项目已部署在阿里云 AlibabaCloudLinux 服务器 (`8.219.110.163:8080`)。

部署步骤：

1. **构建前端**

```bash
npm run build
# 输出到 dist/
```

2. **上传文件**

```bash
# 前端静态文件 → /var/www/academic-research/
# Qwen 服务 → /opt/qwen-llm/
# CQP 服务 → /opt/cqp-search/
# 语料库 → /opt/cqp-search/corpus/
# Nginx 配置 → /etc/nginx/conf.d/academic.conf
```

3. **配置 systemd 服务**

```bash
# qwen-llm.service
systemctl enable qwen-llm --now

# cqp-search.service
systemctl enable cqp-search --now

# Nginx
systemctl enable nginx --now
```

4. **设置 API Key**

编辑 `/etc/systemd/system/qwen-llm.service`，添加：

```
Environment=DASHSCOPE_API_KEY=sk-your-key
```

### Nginx 反向代理

```
端口 8080
├── /              → 静态文件 (SPA)
├── /api/cqp/*     → CQP 引擎 (:5001)
└── /api/*         → Qwen LLM (:5000)
```

---

## 后端 API 一览

### Qwen LLM 服务 (`:5000`)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/analyze-topic` | POST | 研究选题分析 |
| `/api/generate-literature-review` | POST | 生成文献综述 |
| `/api/generate-research-ideas` | POST | 生成研究思路 |
| `/api/generate-research-framework` | POST | 研究框架设计 |
| `/api/generate-experiment-design` | POST | 实验方案生成 |
| `/api/analyze-results` | POST | 实验结果分析 |
| `/api/translate-keywords` | POST | 中英双向关键词翻译 |
| `/api/nl-to-cqp` | POST | 自然语言→CQP 查询转换 |

### CQP 查询引擎 (`:5001`)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/cqp/health` | GET | 健康检查 |
| `/api/cqp/corpora` | GET | 列出所有语料文件 |
| `/api/cqp/search` | POST | KWIC 索引行检索 (word/regex/phrase) |
| `/api/cqp/collocation` | POST | 搭配分析 |

### CQP 检索参数

```json
{
  "query": "孙悟空",       // 查询词/正则
  "searchType": "word",    // word | regex | phrase
  "contextSize": 30,       // 左右上下文字符数
  "maxResults": 100,       // 最大返回条数
  "corpus": null           // 可选：指定语料文件
}
```

---

## 语料库资源

本地语料库位于 `corpus/` 目录，为 **"中国古典小说名著百部"**，包含 100 部中国古典文学名著：

| 类别 | 数量 |
|------|------|
| **总文件数** | 339 个 .txt |
| **总大小** | ~75 MB |
| **总字符数** | ~3800 万字 |
| **总行数** | ~27 万行 |

### 代表作

| 作品 | 作者 | 大小 |
|------|------|------|
| 《水浒全传》 | 施耐庵 | ~1.8 MB |
| 《红楼梦》 | 曹雪芹 | ~1.7 MB |
| 《三国演义》 | 罗贯中 | ~1.4 MB |
| 《西游记》 | 吴承恩 | ~1.4 MB |
| 《唐宋传奇》 | 今人辑 | 193篇短篇 |

语料编码为 **UTF-8**，纯文本格式，按作品独立存放。

---

## 项目结构

```
AcademicResearch/
├── index.html                     # SPA 入口
├── package.json                   # 前端依赖与脚本
├── vite.config.ts                 # Vite 构建配置
├── tsconfig.json                  # TypeScript 配置
├── tailwind.config.js             # Tailwind CSS 配置
├── setup.bat                      # Windows 一键安装脚本
├── nginx-academic.conf            # Nginx 生产配置
│
├── src/                           # 前端源码
│   ├── main.tsx                   # React 入口
│   ├── App.tsx                    # 路由配置
│   ├── index.css                  # 全局样式
│   ├── types/index.ts             # TypeScript 类型定义
│   ├── stores/                    # Zustand 状态管理
│   │   ├── useResearchStore.ts    # 研究项目状态
│   │   └── useExperimentStore.ts  # 实验状态
│   ├── services/
│   │   ├── QwenService.ts         # Qwen LLM API 前端调用
│   │   ├── DatasetService.ts      # 数据集服务
│   │   ├── ExperimentService.ts   # 实验服务 (集成 Qwen)
│   │   └── mcp/                   # MCP 服务前端封装
│   │       ├── CorpusService.ts   # 语料库分析 + CQP 调用
│   │       ├── LiteratureService.ts # 文献检索 (双语)
│   │       ├── MapService.ts      # 地图服务
│   │       └── StatisticsService.ts # 统计年鉴服务
│   ├── components/
│   │   ├── Layout/                # 布局 (Header, Sidebar)
│   │   ├── Dashboard/             # 仪表盘
│   │   ├── ResearchTopic/         # ★ 5步研究流程
│   │   ├── Literature/            # 独立文献检索
│   │   ├── Corpus/                # ★ CQP 语料库检索
│   │   ├── Dataset/               # 数据集管理
│   │   ├── Experiment/            # 实验设计
│   │   ├── Results/               # 结果分析
│   │   └── Statistics/            # 地图与统计年鉴
│   └── utils/
│       └── mockData.ts            # Mock 数据 (降级备用)
│
├── corpus/                        # 本地语料库 (339个文件, 75MB)
│   └── 10中国古典小说名著百部/     # 100部中国古典小说
│
├── mcp-servers/                   # Python 后端微服务
│   ├── qwen-llm/                  # ★ Qwen LLM API 服务
│   │   ├── server.py              # Flask API (7个学术端点)
│   │   └── requirements.txt       # flask, flask-cors, gunicorn
│   ├── cqp-search/                # ★ CQP 语料查询引擎
│   │   ├── server.py              # Flask API (KWIC + 搭配)
│   │   ├── requirements.txt
│   │   └── cqp-search.service     # systemd 服务文件
│   ├── corpus/                    # 语料分析 MCP 服务
│   ├── literature/                # 英文文献 MCP 服务
│   ├── cnki-scraper/              # 中文文献 MCP 服务
│   └── statistics/                # 统计年鉴 MCP 服务
│
└── .cursor/
    └── mcp.json                   # Cursor IDE MCP 配置
```

---

## License

**MIT License** — 学术研究与学习用途免费使用。

---

<p align="center">
  <sub>Built with ?? by AI-assisted development · Powered by Qwen + React + Flask</sub>
</p>
