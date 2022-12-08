import { Provider } from './provider';

export class TestProvider extends Provider {
  getUrlForResult(result) {
    return `https://test.tamanu.io/${result.id}`;
  }
}
