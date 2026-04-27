import { TamanuApi } from '@tamanu/api-client';

const CACHEABLE_ENTITIES = new Set(['location', 'locationGroup', 'department', 'facility']);

export class RandomEntityFetcher {
  private readonly api: TamanuApi;
  private readonly cache = new Map<string, any[]>();

  constructor(api: TamanuApi) {
    this.api = api;
  }

  /**
   * @param query Optional query string params for `/api/random/:entity` — JSON `where` / `include`
   *   (string model names in include are resolved server-side). See facility-server `random.js`.
   */
  async getRandom(entity: string, query: Record<string, string> = {}) {
    if (CACHEABLE_ENTITIES.has(entity) && Object.keys(query).length === 0) {
      return this.getRandomCached(entity);
    }
    return this.api.get(`random/${entity}`, query);
  }

  private async getRandomCached(entity: string) {
    const cached = this.cache.get(entity);
    if (cached && cached.length > 0) {
      return cached[Math.floor(Math.random() * cached.length)];
    }

    const record = await this.api.get(`random/${entity}`);
    if (!this.cache.has(entity)) {
      this.cache.set(entity, []);
    }
    this.cache.get(entity)!.push(record);
    return record;
  }
}
