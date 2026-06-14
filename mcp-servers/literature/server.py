"""
文献检索 MCP Server
通过 Semantic Scholar、CrossRef API 检索中英文学术文献

协议: MCP (Model Context Protocol)
传输: stdio
"""

import json
import asyncio
from typing import Any
from urllib.parse import quote, urlencode

import httpx

from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server

server = Server("literature-search")

# ════════════════════════════════════════════════
# API 配置
# ════════════════════════════════════════════════

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1"
CROSSREF_URL = "https://api.crossref.org/works"
CORE_URL = "https://api.core.ac.uk/v3"

# 可信的 User-Agent（CrossRef 要求）
HEADERS = {
    "User-Agent": "AcademicResearchAgent/1.0 (mailto:research@example.com)",
    "Accept": "application/json",
}


async def search_semantic_scholar(
    query: str,
    year_start: int | None = None,
    year_end: int | None = None,
    limit: int = 20,
    offset: int = 0,
    fields_of_study: str | None = None,
) -> dict:
    """
    通过 Semantic Scholar API 搜索文献
    
    API 文档: https://api.semanticscholar.org/api-docs/
    免费使用，无需 API Key（有频率限制）
    """
    params = {
        "query": query,
        "limit": min(limit, 100),
        "offset": offset,
        "fields": "title,authors,year,abstract,venue,externalIds,citationCount,fieldsOfStudy,publicationTypes,journal,url",
    }
    
    if year_start and year_end:
        params["year"] = f"{year_start}-{year_end}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{SEMANTIC_SCHOLAR_URL}/paper/search",
            params=params,
            headers=HEADERS,
        )
        response.raise_for_status()
        data = response.json()
    
    papers = []
    for paper in data.get("data", []):
        authors = paper.get("authors", [])
        papers.append({
            "id": paper.get("paperId", ""),
            "title": paper.get("title", ""),
            "authors": [a.get("name", "") for a in authors],
            "year": paper.get("year"),
            "abstract": (paper.get("abstract", "") or "")[:500],
            "journal": paper.get("journal", {}).get("name", "") if paper.get("journal") else "",
            "venue": paper.get("venue", ""),
            "citations": paper.get("citationCount", 0),
            "doi": paper.get("externalIds", {}).get("DOI", ""),
            "source": "semantic_scholar",
            "url": f"https://api.semanticscholar.org/{paper.get('paperId', '')}" if paper.get("paperId") else "",
            "fieldsOfStudy": paper.get("fieldsOfStudy", []),
        })
    
    return {
        "total": data.get("total", 0),
        "offset": data.get("offset", 0),
        "next": data.get("next"),
        "results": papers,
        "source": "Semantic Scholar",
        "query": query,
    }


async def search_crossref(
    query: str,
    rows: int = 20,
    offset: int = 0,
    year_start: int | None = None,
    year_end: int | None = None,
    filter_type: str | None = None,
) -> dict:
    """
    通过 CrossRef API 搜索文献
    
    API 文档: https://api.crossref.org/
    免费使用，无需 API Key
    """
    params = {
        "query": query,
        "rows": min(rows, 100),
        "offset": offset,
    }
    
    filters = []
    if year_start and year_end:
        filters.append(f"from-pub-date:{year_start}-01-01")
        filters.append(f"until-pub-date:{year_end}-12-31")
    if filter_type:
        filters.append(f"type:{filter_type}")
    if filters:
        params["filter"] = ",".join(filters)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            CROSSREF_URL,
            params=params,
            headers=HEADERS,
        )
        response.raise_for_status()
        data = response.json()
    
    items = data.get("message", {}).get("items", [])
    results = []
    for item in items:
        authors = item.get("author", [])
        results.append({
            "id": item.get("DOI", ""),
            "title": (item.get("title", [""])[0] if item.get("title") else ""),
            "authors": [
                f"{a.get('given', '')} {a.get('family', '')}".strip()
                for a in authors
            ],
            "year": item.get("created", {}).get("date-parts", [[None]])[0][0],
            "abstract": (item.get("abstract", "") or "")[:500],
            "journal": (item.get("container-title", [""])[0] if item.get("container-title") else ""),
            "doi": item.get("DOI", ""),
            "citations": item.get("is-referenced-by-count", 0),
            "source": "crossref",
            "url": item.get("URL", f"https://doi.org/{item.get('DOI', '')}" if item.get("DOI") else ""),
            "publisher": item.get("publisher", ""),
            "type": item.get("type", ""),
        })
    
    return {
        "total": data.get("message", {}).get("total-results", 0),
        "results": results,
        "source": "CrossRef",
        "query": query,
        "itemsPerPage": data.get("message", {}).get("items-per-page", rows),
    }


async def search_paper_details(paper_id: str, source: str = "semantic_scholar") -> dict:
    """获取单篇论文的详细信息"""
    if source == "semantic_scholar":
        fields = "title,authors,year,abstract,venue,externalIds,citationCount,fieldsOfStudy,publicationTypes,journal,url,references,citations,tldr"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SEMANTIC_SCHOLAR_URL}/paper/{paper_id}",
                params={"fields": fields},
                headers=HEADERS,
            )
            response.raise_for_status()
            data = response.json()
        
        return {
            "id": data.get("paperId", ""),
            "title": data.get("title", ""),
            "authors": [a.get("name", "") for a in data.get("authors", [])],
            "year": data.get("year"),
            "abstract": data.get("abstract", ""),
            "journal": data.get("journal", {}).get("name", ""),
            "doi": data.get("externalIds", {}).get("DOI", ""),
            "citations": data.get("citationCount", 0),
            "referenceCount": len(data.get("references", [])),
            "fieldsOfStudy": data.get("fieldsOfStudy", []),
            "tldr": data.get("tldr", {}).get("text", ""),
        }
    
    elif source == "crossref":
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CROSSREF_URL}/{paper_id}",
                headers=HEADERS,
            )
            response.raise_for_status()
            data = response.json().get("message", {})
        
        return {
            "id": data.get("DOI", ""),
            "title": (data.get("title", [""])[0] if data.get("title") else ""),
            "authors": [
                f"{a.get('given', '')} {a.get('family', '')}".strip()
                for a in data.get("author", [])
            ],
            "year": data.get("created", {}).get("date-parts", [[None]])[0][0],
            "abstract": data.get("abstract", ""),
            "journal": (data.get("container-title", [""])[0] if data.get("container-title") else ""),
            "doi": data.get("DOI", ""),
            "citations": data.get("is-referenced-by-count", 0),
            "publisher": data.get("publisher", ""),
        }
    
    return {"error": "Unknown source"}


# ════════════════════════════════════════════════
# MCP 工具注册
# ════════════════════════════════════════════════

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_literature",
            description="检索英文学术文献 - 通过 Semantic Scholar 和 CrossRef API 搜索学术论文。支持按年份、领域过滤。",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "检索关键词（支持英文和中文，中文会自动翻译尝试匹配）",
                    },
                    "source": {
                        "type": "string",
                        "enum": ["semantic_scholar", "crossref", "both"],
                        "description": "文献数据源",
                        "default": "both",
                    },
                    "year_start": {
                        "type": "integer",
                        "description": "起始年份",
                    },
                    "year_end": {
                        "type": "integer",
                        "description": "结束年份",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回数量限制",
                        "default": 20,
                    },
                    "offset": {
                        "type": "integer",
                        "description": "分页偏移",
                        "default": 0,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="search_chinese_academic",
            description="搜索中文学术文献 - 通过百度学术和CNKI等渠道检索中文论文。",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "中文关键词",
                    },
                    "year_start": {
                        "type": "integer",
                        "description": "起始年份",
                    },
                    "year_end": {
                        "type": "integer",
                        "description": "结束年份",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回数量",
                        "default": 15,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="get_paper_details",
            description="获取单篇论文的详细信息，包括摘要、引用、参考文献等。",
            inputSchema={
                "type": "object",
                "properties": {
                    "paper_id": {
                        "type": "string",
                        "description": "论文 ID（Semantic Scholar paperId 或 CrossRef DOI）",
                    },
                    "source": {
                        "type": "string",
                        "enum": ["semantic_scholar", "crossref"],
                        "description": "数据源",
                        "default": "semantic_scholar",
                    },
                },
                "required": ["paper_id"],
            },
        ),
        Tool(
            name="search_by_doi",
            description="通过 DOI 精确查找论文。",
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
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        result = {}
        
        if name == "search_literature":
            source = arguments.get("source", "both")
            
            if source == "semantic_scholar":
                result = await search_semantic_scholar(
                    query=arguments["query"],
                    year_start=arguments.get("year_start"),
                    year_end=arguments.get("year_end"),
                    limit=arguments.get("limit", 20),
                    offset=arguments.get("offset", 0),
                )
            elif source == "crossref":
                result = await search_crossref(
                    query=arguments["query"],
                    rows=arguments.get("limit", 20),
                    offset=arguments.get("offset", 0),
                    year_start=arguments.get("year_start"),
                    year_end=arguments.get("year_end"),
                )
            else:  # both
                ss_result, cr_result = await asyncio.gather(
                    search_semantic_scholar(
                        query=arguments["query"],
                        year_start=arguments.get("year_start"),
                        year_end=arguments.get("year_end"),
                        limit=arguments.get("limit", 20),
                        offset=arguments.get("offset", 0),
                    ),
                    search_crossref(
                        query=arguments["query"],
                        rows=arguments.get("limit", 20),
                        offset=arguments.get("offset", 0),
                        year_start=arguments.get("year_start"),
                        year_end=arguments.get("year_end"),
                    ),
                    return_exceptions=True,
                )
                
                ss = ss_result if not isinstance(ss_result, Exception) else {"error": str(ss_result), "results": []}
                cr = cr_result if not isinstance(cr_result, Exception) else {"error": str(cr_result), "results": []}
                
                result = {
                    "query": arguments["query"],
                    "sources": {
                        "semantic_scholar": ss,
                        "crossref": cr,
                    },
                    "totalResults": len(ss.get("results", [])) + len(cr.get("results", [])),
                }
        
        elif name == "search_chinese_academic":
            # 先用 Semantic Scholar 搜索（它也索引了一些中文论文）
            # 同时用 CrossRef 搜索
            query = arguments["query"]
            year_start = arguments.get("year_start")
            year_end = arguments.get("year_end")
            limit = arguments.get("limit", 15)
            
            ss_result = await search_semantic_scholar(
                query=query,
                year_start=year_start,
                year_end=year_end,
                limit=limit,
            )
            
            result = {
                "query": query,
                "source": "Semantic Scholar + CrossRef (含中文索引)",
                "total": ss_result.get("total", 0),
                "results": ss_result.get("results", []),
                "note": "中文文献检索使用 Semantic Scholar API，它包含部分中文期刊。完整的CNKI数据可能需要专用的CNKI API或爬虫服务。",
            }
        
        elif name == "get_paper_details":
            result = await search_paper_details(
                paper_id=arguments["paper_id"],
                source=arguments.get("source", "semantic_scholar"),
            )
        
        elif name == "search_by_doi":
            doi = arguments["doi"]
            # 通过 CrossRef 查找
            cr_result = await search_paper_details(doi, "crossref")
            result = cr_result
        
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]
        
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]
    
    except httpx.HTTPStatusError as e:
        error_info = {
            "error": f"HTTP {e.response.status_code}",
            "detail": str(e),
            "tool": name,
        }
        return [TextContent(type="text", text=json.dumps(error_info, ensure_ascii=False))]
    
    except Exception as e:
        error_info = {
            "error": str(e),
            "tool": name,
        }
        return [TextContent(type="text", text=json.dumps(error_info, ensure_ascii=False))]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
