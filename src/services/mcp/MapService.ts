import type { MapSearchQuery, MapLayer } from '@/types';
import { mockMapLayers } from '@/utils/mockData';

/**
 * 地图检索服务 - OpenStreetMap Nominatim 地理编码 + 本地图层数据
 */
class MapService {
  private NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  private async fetchJson(url: string, params: Record<string, string>): Promise<unknown> {
    try {
      const searchParams = new URLSearchParams(params);
      const resp = await fetch(`${url}?${searchParams}`, {
        headers: {
          'User-Agent': 'AcademicResearchAgent/1.0',
          'Accept': 'application/json',
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    } catch {
      return null;
    }
  }

  /**
   * 搜索地图图层
   */
  async searchMaps(query: MapSearchQuery): Promise<{
    layers: MapLayer[];
    center: [number, number];
    zoom: number;
  }> {
    // 用本地图层数据
    const filtered = mockMapLayers.filter(l =>
      l.type === query.layerType ||
      (query.theme && l.metadata.theme?.includes(query.theme))
    );

    // 如果指定了地区，尝试地理编码获取中心坐标
    let center: [number, number] = [104.0, 35.0]; // 默认中国中心
    if (query.region) {
      try {
        const data = await this.fetchJson(`${this.NOMINATIM_URL}/search`, {
          q: query.region,
          format: 'json',
          limit: '1',
          'accept-language': 'zh',
        }) as Array<{ lat: string; lon: string }> | null;
        if (data && data.length > 0) {
          center = [Number(data[0].lon), Number(data[0].lat)];
        }
      } catch {
        // 使用默认坐标
      }
    }

    return {
      layers: filtered.length > 0 ? filtered : mockMapLayers,
      center,
      zoom: query.region === '' ? 4 : 8,
    };
  }

  async getAvailableLayers(): Promise<MapLayer[]> {
    return mockMapLayers;
  }

  /**
   * 地理编码 - 通过 OpenStreetMap Nominatim 实时查询
   */
  async searchLocation(query: string): Promise<{
    name: string;
    coordinates: [number, number];
    type: string;
    metadata: Record<string, string>;
    osmData?: unknown;
  }> {
    try {
      const data = await this.fetchJson(`${this.NOMINATIM_URL}/search`, {
        q: query,
        format: 'json',
        limit: '5',
        'accept-language': 'zh',
      }) as Array<Record<string, string>> | null;

      if (data && data.length > 0) {
        const first = data[0];
        return {
          name: first.display_name || query,
          coordinates: [Number(first.lon), Number(first.lat)],
          type: first.type || first.category || 'unknown',
          metadata: {
            osmType: first.osm_type || '',
            osmId: first.osm_id || '',
            category: first.category || '',
            importance: first.importance || '',
            boundingbox: first.boundingbox || '',
            timestamp: new Date().toISOString(),
          },
          osmData: data.slice(0, 3),
        };
      }
    } catch {
      // 降级到硬编码坐标
    }

    // 降级坐标
    const fallbackLocations: Record<string, [number, number]> = {
      '北京': [116.4, 39.9],
      '上海': [121.5, 31.2],
      '西安': [109.0, 34.3],
      '广州': [113.3, 23.1],
      '成都': [104.1, 30.6],
      '南京': [118.8, 32.1],
      '杭州': [120.2, 30.3],
      '武汉': [114.3, 30.6],
      '丝绸之路': [109.0, 34.3],
    };

    const coords = fallbackLocations[query] || [116.4, 39.9];

    return {
      name: query,
      coordinates: coords,
      type: 'fallback',
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        source: '本地降级坐标',
      },
    };
  }
}

export const mapService = new MapService();
