import { TamanuApi } from '@tamanu/api-client';

export class RandomEntityFetcher {
  private readonly api: TamanuApi;

  constructor(api: TamanuApi) {
    this.api = api;
  }

  async getRandom(entity: string) {
    const response = await this.api.get(`random/${entity}`);
    return response.data ?? response;
  }
}
