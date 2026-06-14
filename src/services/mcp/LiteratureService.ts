import type {
  LiteratureSearchQuery, LiteratureSearchResult, Reference,
} from '@/types';
import { mockReferences } from '@/utils/mockData';

/**
 * 文献检索服务 - 通过真实 API 检索文献数据库
 *
 * 数据源:
 *   - OpenAlex API (免费, 2.5亿+学术作品) - https://api.openalex.org/
 *   - Semantic Scholar API (免费) - https://api.semanticscholar.org/
 *   - 降级: 本地 mock 数据
 */

const OPENALEX_URL = 'https://api.openalex.org/works';
const SEMANTIC_SCHOLAR_URL = 'https://api.semanticscholar.org/graph/v1';

// ── API 通用请求 ──
async function fetchJson(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const searchParams = new URLSearchParams(params);
  const resp = await fetch(`${url}?${searchParams}`, {
    headers: { 'User-Agent': 'AcademicResearchAgent/1.0 (mailto:research@example.com)' },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// ── OpenAlex 搜索 ──
interface OpenAlexWork {
  id: string;
  doi: string;
  title: string;
  authorships: Array<{ author: { display_name: string } }>;
  publication_year: number;
  abstract_inverted_index?: Record<string, number[]>;
  cited_by_count: number;
  primary_location: {
    source?: { display_name: string };
    landing_page_url: string;
  };
  concepts: Array<{ display_name: string; level: number }>;
  type: string;
  language: string;
}

function reconstructAbstract(inverted: Record<string, number[]> | undefined): string {
  if (!inverted) return '';
  const wordPositions: [string, number][] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) wordPositions.push([word, pos]);
  }
  wordPositions.sort((a, b) => a[1] - b[1]);
  return wordPositions.map(w => w[0]).join(' ');
}

async function searchOpenAlex(
  query: string,
  perPage: number = 20,
  page: number = 1,
  langFilter: string = '',
): Promise<LiteratureSearchResult> {
  try {
    const params: Record<string, string> = {
      search: query,
      per_page: String(Math.min(perPage, 200)),
      page: String(page),
      sort: 'cited_by_count:desc',
    };
    if (langFilter) params['filter'] = `language:${langFilter}`;

    const data = await fetchJson(OPENALEX_URL, params);

    const works = (data['results'] as OpenAlexWork[]) || [];
    const total = (data['meta'] as Record<string, unknown>)?.['count'] as number || 0;
    const results: Reference[] = works.map(w => ({
      id: `oa-${w.id.split('/').pop()}`,
      title: w.title || '未知标题',
      authors: w.authorships?.map(a => a.author?.display_name || '未知') || [],
      year: w.publication_year || 0,
      journal: w.primary_location?.source?.display_name || '',
      doi: w.doi || '',
      abstract: reconstructAbstract(w.abstract_inverted_index),
      keywords: (w.concepts || []).filter(c => c.level === 0).map(c => c.display_name),
      source: 'openalex',
      citations: w.cited_by_count || 0,
      url: w.primary_location?.landing_page_url || '',
    }));

    // 生成 facets
    const yearFacets = new Map<number, number>();
    results.forEach(r => {
      if (r.year) yearFacets.set(r.year, (yearFacets.get(r.year) || 0) + 1);
    });

    return {
      total,
      results,
      facets: [
        {
          field: 'year',
          values: Array.from(yearFacets.entries())
            .sort((a, b) => b[0] - a[0])
            .slice(0, 10)
            .map(([label, count]) => ({ label: String(label), count })),
        },
      ],
    };
  } catch (e) {
    console.warn('OpenAlex API 失败，降级为 mock 数据:', e);
    return { total: 0, results: [], facets: [] };
  }
}

// ── Semantic Scholar 搜索 ──
interface SSPaper {
  paperId: string;
  title: string;
  authors: Array<{ name: string }>;
  year: number | null;
  abstract: string | null;
  journal?: { name: string };
  externalIds?: { DOI?: string };
  citationCount: number;
  url?: string;
  fieldsOfStudy?: string[];
}

async function searchSemanticScholar(
  query: string,
  limit: number = 20,
  offset: number = 0,
  yearStart?: number,
  yearEnd?: number,
): Promise<LiteratureSearchResult> {
  try {
    const params: Record<string, string> = {
      query,
      limit: String(Math.min(limit, 100)),
      offset: String(offset),
      fields: 'title,authors,year,abstract,journal,externalIds,citationCount,fieldsOfStudy,url',
    };

    // Semantic Scholar 的 year 参数格式是 YYYY[-YYYY]
    if (yearStart && yearEnd) {
      params['year'] = `${yearStart}-${yearEnd}`;
    }

    const data = await fetchJson(`${SEMANTIC_SCHOLAR_URL}/paper/search`, params);

    const papers = (data['data'] as SSPaper[]) || [];
    const total = (data['total'] as number) || 0;
    const results: Reference[] = papers.map(p => ({
      id: `ss-${p.paperId}`,
      title: p.title || '未知标题',
      authors: p.authors?.map(a => a.name || '未知') || [],
      year: p.year || 0,
      journal: p.journal?.name || '',
      doi: p.externalIds?.DOI || '',
      abstract: p.abstract || '',
      keywords: p.fieldsOfStudy || [],
      source: 'semantic_scholar',
      citations: p.citationCount || 0,
      url: p.url || '',
    }));

    return {
      total,
      results,
      facets: [
        {
          field: 'year',
          values: Array.from(
            results.reduce((m, r) => {
              const y = String(r.year);
              m.set(y, (m.get(y) || 0) + 1);
              return m;
            }, new Map<string, number>())
          )
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .slice(0, 10)
            .map(([label, count]) => ({ label, count })),
        },
      ],
    };
  } catch (e) {
    console.warn('Semantic Scholar API 失败，降级为 mock 数据:', e);
    return { total: 0, results: [], facets: [] };
  }
}

// ── LiteratureService 类 ──
class LiteratureService {
  /**
   * 搜索 CNKI 中文文献 (通过 OpenAlex 中文索引)
   */
  async searchCNKI(query: LiteratureSearchQuery): Promise<LiteratureSearchResult> {
    const keyword = query.keywords.join(' ');
    const result = await searchOpenAlex(keyword, query.limit, 1, 'zh');

    // 降级: 使用 mock 数据补充
    if (result.results.length === 0) {
      const mockResults = mockReferences.filter(ref =>
        ref.source === 'cnki' &&
        query.keywords.some(kw => ref.title.includes(kw))
      );
      return {
        total: mockResults.length,
        results: mockResults,
        facets: [
          { field: 'year', values: [{ label: '2024', count: 5 }, { label: '2023', count: 8 }] },
        ],
      };
    }
    return result;
  }

  /**
   * 搜索 Web of Science 英文文献 (通过 Semantic Scholar)
   */
  async searchWoS(query: LiteratureSearchQuery): Promise<LiteratureSearchResult> {
    const keyword = query.keywords.join(' ');
    const result = await searchSemanticScholar(
      keyword,
      query.limit,
      0,
      query.dateRange?.start,
      query.dateRange?.end,
    );

    if (result.results.length === 0) {
      const mockResults = mockReferences.filter(ref =>
        ref.source === 'web_of_science' &&
        query.keywords.some(kw => ref.title.toLowerCase().includes(kw.toLowerCase()))
      );
      return {
        total: mockResults.length,
        results: mockResults,
        facets: [
          { field: 'year', values: [{ label: '2024', count: 10 }, { label: '2023', count: 12 }] },
        ],
      };
    }
    return result;
  }

  /**
   * 搜索 Scopus (通过 Semantic Scholar)
   */
  async searchScopus(query: LiteratureSearchQuery): Promise<LiteratureSearchResult> {
    const keyword = query.keywords.join(' ');
    const result = await searchSemanticScholar(
      keyword,
      query.limit,
      0,
      query.dateRange?.start,
      query.dateRange?.end,
    );

    if (result.results.length === 0) {
      const mockResults = mockReferences.filter(ref =>
        ref.source === 'scopus' &&
        query.keywords.some(kw => ref.title.toLowerCase().includes(kw.toLowerCase()))
      );
      return {
        total: mockResults.length,
        results: mockResults,
        facets: [],
      };
    }
    return result;
  }

  /**
   * 跨库联合搜索 (OpenAlex + Semantic Scholar)
   */
  async searchAll(query: LiteratureSearchQuery): Promise<LiteratureSearchResult> {
    const keyword = query.keywords.join(' ');

    // 并行请求两个数据源
    const [oaResult, ssResult] = await Promise.all([
      searchOpenAlex(keyword, Math.floor(query.limit / 2), 1),
      searchSemanticScholar(
        keyword,
        Math.floor(query.limit / 2),
        0,
        query.dateRange?.start,
        query.dateRange?.end,
      ),
    ]);

    // 去重 (按 DOI)
    const seenDoi = new Set<string>();
    const allResults: Reference[] = [];

    for (const r of [...oaResult.results, ...ssResult.results]) {
      const key = r.doi || r.title;
      if (!seenDoi.has(key)) {
        seenDoi.add(key);
        allResults.push(r);
      }
    }

    const total = allResults.length;

    // 降级
    if (total === 0) {
      const mockResults = mockReferences.filter(ref =>
        query.keywords.some(kw => ref.title.includes(kw))
      );
      return {
        total: mockResults.length,
        results: mockResults,
        facets: [
          { field: 'source', values: [{ label: 'OpenAlex', count: 0 }, { label: 'Semantic Scholar', count: 0 }] },
        ],
      };
    }

    return {
      total,
      results: allResults.slice(0, query.limit),
      facets: [
        { field: 'source', values: [{ label: 'OpenAlex', count: oaResult.results.length }, { label: 'Semantic Scholar', count: ssResult.results.length }] },
      ],
    };
  }

  async getById(id: string): Promise<Reference | null> {
    // 先从 mock 中查找
    const mock = mockReferences.find(r => r.id === id);
    if (mock) return mock;
    return null;
  }

  /**
   * 通过 DOI 精确查找论文 (实时 API)
   */
  async searchByDOI(doi: string): Promise<Reference | null> {
    try {
      const data = await fetchJson(`${OPENALEX_URL}/doi:${encodeURIComponent(doi)}`, {});
      const w = data as unknown as OpenAlexWork;
      return {
        id: `oa-doi-${doi}`,
        title: w.title || '',
        authors: w.authorships?.map(a => a.author?.display_name || '') || [],
        year: w.publication_year || 0,
        journal: w.primary_location?.source?.display_name || '',
        doi: w.doi || doi,
        abstract: reconstructAbstract(w.abstract_inverted_index),
        keywords: (w.concepts || []).filter(c => c.level === 0).map(c => c.display_name),
        source: 'openalex',
        citations: w.cited_by_count || 0,
        url: w.primary_location?.landing_page_url || '',
      };
    } catch {
      return null;
    }
  }
}

export const literatureService = new LiteratureService();
