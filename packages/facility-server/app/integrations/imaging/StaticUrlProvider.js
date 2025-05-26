import { Provider } from './Provider';

export class StaticUrlProvider extends Provider {
  async getUrlForResult(result) {
    const { resultImageUrl } = result;
    if (!resultImageUrl) return null;

    return resultImageUrl;
  }
}
