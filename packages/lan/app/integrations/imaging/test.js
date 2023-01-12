import { Provider } from './provider';

export class TestProvider extends Provider {
  getUrlForResult(result) {
    const { description, externalCode } = result;
    if (/external/i.test(description) || externalCode) {
      return `https://test.tamanu.io/${result.id}`;
    }

    return null;
  }
}
