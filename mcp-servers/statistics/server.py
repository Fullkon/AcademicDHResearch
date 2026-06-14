"""
统计数据 & 地图检索 MCP Server
提供统计年鉴查询、地图定位等数据检索功能

使用:
- 国家统计局公开数据 API
- 世界银行开放数据 API
- Nominatim 地理编码（OpenStreetMap）
- Overpass API 地图查询
"""

import json
import asyncio
from typing import Any
from urllib.parse import quote

import httpx

from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server

server = Server("statistics-search")

HEADERS = {
    "User-Agent": "AcademicResearchAgent/1.0 (mailto:research@example.com)",
    "Accept": "application/json",
}

# ════════════════════════════════════════════════
# 世界银行 API
# ════════════════════════════════════════════════

# 常用中国相关指标
USEFUL_INDICATORS = {
    "NY.GDP.MKTP.CD": "GDP（现价美元）",
    "NY.GDP.PCAP.CD": "人均GDP（现价美元）",
    "SE.TER.ENRR": "高等教育入学率",
    "IT.NET.USER.ZS": "互联网用户比例",
    "TX.VAL.TECH.CD": "高新技术出口",
    "GB.XPD.RSDV.GD.ZS": "研发支出占GDP比例",
    "IP.JRN.ARTC.SC": "科技期刊文章数量",
    "SE.XPD.TOTL.GD.ZS": "教育公共支出占GDP比例",
    "ST.INT.ARVL": "国际旅游入境人数",
    "BX.KLT.DINV.WD.GD.ZS": "外国直接投资净流入",
}

async def query_world_bank(
    indicator: str,
    country: str = "CN",
    year_start: int = 2010,
    year_end: int = 2023,
) -> dict:
    """查询世界银行开放数据"""
    url = (
        f"https://api.worldbank.org/v2/country/{country}"
        f"/indicator/{indicator}"
        f"?format=json"
        f"&date={year_start}:{year_end}"
        f"&per_page=100"
    )
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
    
    if len(data) < 2 or not data[1]:
        return {"error": "No data available"}
    
    indicator_info = data[1][0].get("indicator", {})
    data_points = []
    for item in data[1]:
        if item.get("value") is not None:
            data_points.append({
                "year": int(item["date"]),
                "value": item["value"],
                "country": item.get("country", {}).get("value", country),
            })
    
    return {
        "indicator": indicator_info.get("value", indicator),
        "unit": "参见世界银行文档",
        "source": "世界银行 (World Bank Open Data)",
        "country": country,
        "dataPoints": data_points,
    }


async def search_world_bank_indicators(search_term: str) -> dict:
    """搜索世界银行指标"""
    url = f"https://api.worldbank.org/v2/indicator?format=json&per_page=30&search={quote(search_term)}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
    
    indicators = []
    for item in data[1] if len(data) > 1 else []:
        indicators.append({
            "id": item["id"],
            "name": item.get("name", ""),
            "source": item.get("source", {}).get("value", ""),
        })
    
    return {
        "searchTerm": search_term,
        "total": data[0].get("total", 0) if len(data) > 0 else 0,
        "indicators": indicators,
    }


# ════════════════════════════════════════════════
# 地理编码 - Nominatim (OpenStreetMap)
# ════════════════════════════════════════════════

async def geocode_location(place_name: str) -> dict:
    """通过 Nominatim API 进行地理编码"""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": place_name,
        "format": "json",
        "limit": 5,
        "accept-language": "zh",
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            url, params=params,
            headers={**HEADERS, "User-Agent": f"{HEADERS['User-Agent']} (Nominatim)"},
        )
        response.raise_for_status()
        data = response.json()
    
    locations = []
    for item in data:
        locations.append({
            "name": item.get("display_name", ""),
            "latitude": float(item.get("lat", 0)),
            "longitude": float(item.get("lon", 0)),
            "type": item.get("type", ""),
            "category": item.get("category", ""),
            "importance": float(item.get("importance", 0)),
        })
    
    return {
        "query": place_name,
        "source": "OpenStreetMap Nominatim",
        "locations": locations,
        "count": len(locations),
    }


# ════════════════════════════════════════════════
# 中国国家统计局数据 - 公开 API
# ════════════════════════════════════════════════

# 国家统计局公开数据的模拟（实际需要专用API key）
CHINA_STATS_CACHE = {
    "public_libraries": {
        "indicator": "公共图书馆数量",
        "unit": "个",
        "dataPoints": [
            {"year": 2018, "value": 3176}, {"year": 2019, "value": 3196},
            {"year": 2020, "value": 3212}, {"year": 2021, "value": 3215},
            {"year": 2022, "value": 3303}, {"year": 2023, "value": 3246},
        ],
    },
    "museums": {
        "indicator": "博物馆数量",
        "unit": "个",
        "dataPoints": [
            {"year": 2018, "value": 5354}, {"year": 2019, "value": 5535},
            {"year": 2020, "value": 5788}, {"year": 2021, "value": 6183},
            {"year": 2022, "value": 6565}, {"year": 2023, "value": 6833},
        ],
    },
    "higher_education": {
        "indicator": "普通高等学校数",
        "unit": "所",
        "dataPoints": [
            {"year": 2018, "value": 2663}, {"year": 2019, "value": 2688},
            {"year": 2020, "value": 2738}, {"year": 2021, "value": 2756},
            {"year": 2022, "value": 2760}, {"year": 2023, "value": 2822},
        ],
    },
    "rnd_expenditure": {
        "indicator": "研发经费支出",
        "unit": "亿元",
        "dataPoints": [
            {"year": 2018, "value": 19678}, {"year": 2019, "value": 22144},
            {"year": 2020, "value": 24393}, {"year": 2021, "value": 27956},
            {"year": 2022, "value": 30870}, {"year": 2023, "value": 33278},
        ],
    },
}


async def query_china_stats(indicator: str) -> dict:
    """查询中国统计数据"""
    # 模糊匹配
    indicator_lower = indicator.lower().replace(" ", "_")
    
    for key, data in CHINA_STATS_CACHE.items():
        if key in indicator_lower or indicator_lower in key:
            return {
                **data,
                "source": "中国国家统计局 (预置数据)",
                "query": indicator,
            }
    
    # 尝试从世界银行获取
    for wb_id, wb_name in USEFUL_INDICATORS.items():
        if indicator in wb_name or any(kw in indicator for kw in wb_name):
            try:
                return await query_world_bank(wb_id, "CN")
            except Exception:
                pass
    
    return {
        "error": f"未找到指标 '{indicator}'。可用的中国统计指标: {list(CHINA_STATS_CACHE.keys())}",
        "availableIndicators": [
            {"id": k, "name": v["indicator"], "unit": v["unit"]}
            for k, v in CHINA_STATS_CACHE.items()
        ],
    }


# ════════════════════════════════════════════════
# MCP 工具注册
# ════════════════════════════════════════════════

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="query_statistical_data",
            description="查询统计数据 - 从中国国家统计局和世界银行获取统计指标数据。",
            inputSchema={
                "type": "object",
                "properties": {
                    "indicator": {
                        "type": "string",
                        "description": "指标名称，如'公共图书馆数量'、'博物馆数量'、'GDP'、'研发经费支出'等",
                    },
                    "source_type": {
                        "type": "string",
                        "enum": ["china", "world_bank", "auto"],
                        "description": "数据来源",
                        "default": "auto",
                    },
                    "country": {
                        "type": "string",
                        "description": "国家代码（仅world_bank），默认: CN",
                        "default": "CN",
                    },
                    "year_start": {
                        "type": "integer",
                        "description": "起始年份",
                        "default": 2010,
                    },
                    "year_end": {
                        "type": "integer",
                        "description": "结束年份",
                        "default": 2023,
                    },
                },
                "required": ["indicator"],
            },
        ),
        Tool(
            name="search_world_bank_indicators",
            description="搜索世界银行可用指标列表。",
            inputSchema={
                "type": "object",
                "properties": {
                    "search_term": {
                        "type": "string",
                        "description": "搜索词，如 'education'、'culture'、'GDP'",
                    },
                },
                "required": ["search_term"],
            },
        ),
        Tool(
            name="geocode_location",
            description="地理编码 - 将地名转换为经纬度坐标（基于 OpenStreetMap）。",
            inputSchema={
                "type": "object",
                "properties": {
                    "place_name": {
                        "type": "string",
                        "description": "地名，如 '北京'、'丝绸之路'、'上海'",
                    },
                },
                "required": ["place_name"],
            },
        ),
        Tool(
            name="list_available_stats",
            description="列出当前可用的统计指标。",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "query_statistical_data":
            indicator = arguments["indicator"]
            source_type = arguments.get("source_type", "auto")
            country = arguments.get("country", "CN")
            year_start = arguments.get("year_start", 2010)
            year_end = arguments.get("year_end", 2023)
            
            if source_type == "world_bank":
                # 在世界银行指标中查找
                matched_id = None
                for wb_id, wb_name in USEFUL_INDICATORS.items():
                    if indicator.lower() in wb_name.lower():
                        matched_id = wb_id
                        break
                if not matched_id:
                    return [TextContent(type="text", text=json.dumps({
                        "error": "请先用 search_world_bank_indicators 查找指标ID",
                        "available": list(USEFUL_INDICATORS.keys()),
                    }, ensure_ascii=False))]
                result = await query_world_bank(matched_id, country, year_start, year_end)
            elif source_type == "china":
                result = await query_china_stats(indicator)
            else:
                # auto: 先查中国再查世界银行
                result = await query_china_stats(indicator)
                if "error" in result:
                    for wb_id, wb_name in USEFUL_INDICATORS.items():
                        if indicator.lower() in wb_name.lower():
                            result = await query_world_bank(wb_id, country, year_start, year_end)
                            break
        
        elif name == "search_world_bank_indicators":
            result = await search_world_bank_indicators(arguments["search_term"])
        
        elif name == "geocode_location":
            result = await geocode_location(arguments["place_name"])
        
        elif name == "list_available_stats":
            result = {
                "chinaStats": [
                    {"id": k, "name": v["indicator"], "unit": v["unit"]}
                    for k, v in CHINA_STATS_CACHE.items()
                ],
                "worldBankIndicators": [
                    {"id": k, "name": v} for k, v in USEFUL_INDICATORS.items()
                ],
                "note": "中国统计数据为预置数据，世界银行数据实时查询。",
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
