"""快速测试 MCP 服务器的 API 连接"""
import asyncio, json
import httpx

async def test_semantic_scholar():
    print("=" * 50)
    print("测试 Semantic Scholar API...")
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": "digital humanities corpus", "limit": 3, "fields": "title,year,authors"},
            headers={"User-Agent": "AcademicAgent/1.0"}
        )
        data = resp.json()
        total = data.get("total", 0)
        print(f"  状态: {resp.status_code}, 总结果: {total}")
        for p in data.get("data", []):
            print(f"  - {p.get('title', 'N/A')[:60]} ({p.get('year', 'N/A')})")
    return True

async def test_openalex():
    print("\n" + "=" * 50)
    print("测试 OpenAlex API...")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            "https://api.openalex.org/works",
            params={"search": "digital humanities", "per_page": 3, "sort": "cited_by_count:desc"},
            headers={"User-Agent": "AcademicAgent/1.0"}
        )
        data = resp.json()
        total = data.get("meta", {}).get("count", 0)
        print(f"  状态: {resp.status_code}, 总结果: {total}")
        for w in data.get("results", []):
            print(f"  - {w.get('title', 'N/A')[:60]} ({w.get('publication_year', 'N/A')})")
    return True

async def test_worldbank():
    print("\n" + "=" * 50)
    print("测试 World Bank API...")
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            "https://api.worldbank.org/v2/country/CN/indicator/NY.GDP.MKTP.CD?format=json&date=2020:2022&per_page=3",
            headers={"User-Agent": "AcademicAgent/1.0"}
        )
        data = resp.json()
        if len(data) > 1:
            for d in data[1]:
                print(f"  - {d.get('date', 'N/A')}: {d.get('value', 'N/A')}")
        print(f"  状态: {resp.status_code}")
    return True

async def test_geocoding():
    print("\n" + "=" * 50)
    print("测试 Nominatim 地理编码...")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": "Beijing", "format": "json", "limit": 1},
            headers={"User-Agent": "AcademicAgent/1.0"}
        )
        data = resp.json()
        if data:
            print(f"  位置: {data[0].get('display_name', 'N/A')[:60]}")
            print(f"  坐标: {data[0].get('lat')}, {data[0].get('lon')}")
        print(f"  状态: {resp.status_code}")
    return True

async def test_corpus_mcp():
    print("\n" + "=" * 50)
    print("测试语料库 MCP 服务功能...")
    import jieba
    text = "数字人文为传统文化研究提供了新的方法和视角"
    words = jieba.lcut(text)
    print(f"  分词结果: {words[:8]}")
    print(f"  jieba 版本: {jieba.__version__}")
    try:
        import gensim
        print(f"  gensim 版本: {gensim.__version__} (LDA可用)")
    except ImportError:
        print(f"  gensim 未安装 (LDA不可用)")
    return True

async def main():
    print("学术研究智能体 - MCP 服务连接测试\n")
    tests = [
        ("Semantic Scholar (英文学术)", test_semantic_scholar),
        ("OpenAlex (全学科学术)", test_openalex),
        ("World Bank (统计数据)", test_worldbank),
        ("Nominatim (地图地理编码)", test_geocoding),
        ("语料库分析 (jieba/gensim)", test_corpus_mcp),
    ]
    
    results = {}
    for name, test_fn in tests:
        try:
            await test_fn()
            results[name] = "✓ 通过"
        except Exception as e:
            results[name] = f"✗ 失败: {str(e)[:80]}"
            print(f"  错误: {e}")
    
    print("\n" + "=" * 50)
    print("测试汇总:")
    for k, v in results.items():
        print(f"  {v}  {k}")

if __name__ == "__main__":
    asyncio.run(main())
