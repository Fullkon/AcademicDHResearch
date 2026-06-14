"""
CNKI 检索辅助 MCP Server
通过官方 CNKI API 或搜索接口获取中文学术文献

注意: CNKI 的完整访问通常需要机构订阅。
此服务提供了基本的检索接口框架。
"""

import json
import asyncio
from typing import Any
from urllib.parse import quote

import httpx

from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server

server = Server("cnki-scraper")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

# 百度学术 API（免费公开，可用于中文学术检索）
BAIDU_XUESHU_URL = "https://xueshu.baidu.com/s"

# OpenAlex API（开放学术图谱，包含中文论文）
OPENALEX_URL = "https://api.openalex.org/works"


async def search_baidu_xueshu(keyword: str, pn: int = 0, limit: int = 10) -> dict:
    """
    通过百度学术搜索中文文献
    百度学术聚合了CNKI、万方、维普等中文数据库
    """
    params = {
        "wd": keyword,
        "pn": pn,
        "rn": min(limit, 20),
        "ie": "utf-8",
    }
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        try:
            response = await client.get(
                BAIDU_XUESHU_URL,
                params=params,
                headers={**HEADERS, "Accept": "text/html,application/xhtml+xml"},
                http2=True,
            )
            response.raise_for_status()
            
            # 返回请求的链接和状态
            return {
                "status": "success",
                "url": str(response.url),
                "statusCode": response.status_code,
                "note": "百度学术搜索结果需要HTML解析，目前返回搜索页面状态。建议在浏览器中直接访问。",
                "searchUrl": f"https://xueshu.baidu.com/s?wd={quote(keyword)}",
            }
        except Exception as e:
            return {
                "error": str(e),
                "suggestion": "百度学术可能需要 Cookie 或验证。请直接在浏览器中访问。",
                "searchUrl": f"https://xueshu.baidu.com/s?wd={quote(keyword)}",
            }


async def search_openalex(
    search_term: str,
    per_page: int = 25,
    page: int = 1,
    filter_lang: str = "zh",
) -> dict:
    """
    通过 OpenAlex API 搜索学术文献
    OpenAlex 是免费的开放学术知识图谱，索引了2.5亿+学术作品
    包含大量中文论文
    """
    params = {
        "search": search_term,
        "per_page": min(per_page, 200),
        "page": page,
        "sort": "cited_by_count:desc",
    }
    
    # 如果需要只返回中文文献
    if filter_lang:
        params["filter"] = f"language:{filter_lang}"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(
            OPENALEX_URL,
            params=params,
            headers=HEADERS,
        )
        response.raise_for_status()
        data = response.json()
    
    results = []
    for work in data.get("results", []):
        authors = work.get("authorships", [])
        results.append({
            "id": work.get("id", "").split("/")[-1],
            "doi": work.get("doi", ""),
            "title": work.get("title", ""),
            "authors": [
                a.get("author", {}).get("display_name", "")
                for a in authors
            ],
            "year": work.get("publication_year"),
            "abstract": "",  # OpenAlex 通常不提供摘要
            "citedByCount": work.get("cited_by_count", 0),
            "type": work.get("type", ""),
            "language": work.get("language", ""),
            "source": work.get("primary_location", {}).get("source", {}).get("display_name", ""),
            "url": work.get("primary_location", {}).get("landing_page_url", ""),
            "openAccess": work.get("open_access", {}).get("is_oa", False),
            "keywords": [
                c.get("display_name", "")
                for c in work.get("concepts", [])
                if c.get("level", 0) == 0
            ],
        })
    
    return {
        "query": search_term,
        "source": "OpenAlex (开放学术知识图谱)",
        "total": data.get("meta", {}).get("count", 0),
        "page": page,
        "perPage": per_page,
        "results": results,
        "nextPage": data.get("meta", {}).get("next_page"),
    }


async def search_openalex_by_doi(doi: str) -> dict:
    """通过 DOI 在 OpenAlex 中精确查找"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{OPENALEX_URL}/doi:{doi}",
            headers=HEADERS,
        )
        
        if response.status_code == 404:
            return {"error": f"未找到 DOI: {doi}"}
        
        response.raise_for_status()
        work = response.json()
    
    authors = work.get("authorships", [])
    return {
        "id": work.get("id", "").split("/")[-1],
        "doi": work.get("doi", ""),
        "title": work.get("title", ""),
        "authors": [
            a.get("author", {}).get("display_name", "") for a in authors
        ],
        "year": work.get("publication_year"),
        "abstract": work.get("abstract_inverted_index", {}),
        "citedByCount": work.get("cited_by_count", 0),
        "type": work.get("type", ""),
        "source": work.get("primary_location", {}).get("source", {}).get("display_name", ""),
        "url": work.get("primary_location", {}).get("landing_page_url", ""),
        "openAccess": work.get("open_access", {}).get("is_oa", False),
        "keywords": [
            c.get("display_name", "") for c in work.get("concepts", [])
        ][:10],
        "referencesCount": len(work.get("referenced_works", [])),
    }


# ════════════════════════════════════════════════
# MCP 工具注册
# ════════════════════════════════════════════════

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_cnki_via_openalex",
            description="通过 OpenAlex 开放学术数据库搜索中文文献。OpenAlex 索引了超过2.5亿学术作品，包含大量CNKI收录的中文论文。",
            inputSchema={
                "type": "object",
                "properties": {
                    "search_term": {
                        "type": "string",
                        "description": "中文检索词（如"数字人文"、"语料库语言学"等）",
                    },
                    "per_page": {
                        "type": "integer",
                        "description": "每页数量",
                        "default": 25,
                    },
                    "page": {
                        "type": "integer",
                        "description": "页码",
                        "default": 1,
                    },
                    "filter_lang": {
                        "type": "string",
                        "description": "语言过滤（zh=中文, en=英文, 留空=全部）",
                        "default": "zh",
                    },
                },
                "required": ["search_term"],
            },
        ),
        Tool(
            name="search_openalex_all",
            description="搜索所有语言的学术文献（中英文混合搜索）。",
            inputSchema={
                "type": "object",
                "properties": {
                    "search_term": {
                        "type": "string",
                        "description": "检索词（支持中英文）",
                    },
                    "per_page": {
                        "type": "integer",
                        "description": "每页数量",
                        "default": 25,
                    },
                    "page": {
                        "type": "integer",
                        "description": "页码",
                        "default": 1,
                    },
                },
                "required": ["search_term"],
            },
        ),
        Tool(
            name="get_paper_by_doi",
            description="通过DOI在OpenAlex中精确查找论文。",
            inputSchema={
                "type": "object",
                "properties": {
                    "doi": {
                        "type": "string",
                        "description": "论文的 DOI",
                    },
                },
                "required": ["doi"],
            },
        ),
        Tool(
            name="search_baidu_xueshu",
            description="生成百度学术搜索链接。百度学术聚合了CNKI、万方、维普等中文数据库的文献信息。",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回数量",
                        "default": 10,
                    },
                },
                "required": ["keyword"],
            },
        ),
        Tool(
            name="get_cnki_related",
            description="获取与搜索词相关的CNKI检索策略建议和可用的中文数据库链接。",
            inputSchema={
                "type": "object",
                "properties": {
                    "research_topic": {
                        "type": "string",
                        "description": "研究主题",
                    },
                },
                "required": ["research_topic"],
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "search_cnki_via_openalex":
            result = await search_openalex(
                search_term=arguments["search_term"],
                per_page=arguments.get("per_page", 25),
                page=arguments.get("page", 1),
                filter_lang=arguments.get("filter_lang", "zh"),
            )
        
        elif name == "search_openalex_all":
            result = await search_openalex(
                search_term=arguments["search_term"],
                per_page=arguments.get("per_page", 25),
                page=arguments.get("page", 1),
                filter_lang="",
            )
        
        elif name == "get_paper_by_doi":
            result = await search_openalex_by_doi(arguments["doi"])
        
        elif name == "search_baidu_xueshu":
            result = await search_baidu_xueshu(
                keyword=arguments["keyword"],
                limit=arguments.get("limit", 10),
            )
        
        elif name == "get_cnki_related":
            topic = arguments["research_topic"]
            encoded = quote(topic)
            result = {
                "topic": topic,
                "searchLinks": {
                    "baiduXueshu": f"https://xueshu.baidu.com/s?wd={encoded}",
                    "cnki": f"https://kns.cnki.net/kns8s/defaultresult/index?kwd={encoded}",
                    "wanfang": f"https://s.wanfangdata.com.cn/paper?q={encoded}",
                    "openalex": f"https://api.openalex.org/works?search={encoded}",
                },
                "searchStrategy": {
                    "cnkiStep": f"1. 访问 https://kns.cnki.net/ 2. 输入 '{topic}' 3. 选择学科分类过滤 4. 按引用/下载排序",
                    "advancedSearch": f"SU=('{topic}') AND YE='2018-2024'",
                    "suggestedDBs": ["CNKI学术期刊", "CNKI硕博论文", "万方数据", "维普中文期刊"],
                },
                "note": "CNKI 需要机构订阅或个人账号登录才能下载全文。OpenAlex 和 Semantic Scholar 提供免费的文献元数据搜索。",
            }
        
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]
        
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
    
    except Exception as e:
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e), "tool": name}, ensure_ascii=False)
        )]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
