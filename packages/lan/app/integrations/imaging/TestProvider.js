import { Provider } from './Provider';

export class TestProvider extends Provider {
  getUrlForResult(result) {
    const { description, externalCode, id } = result;
    if (/external/i.test(description) || externalCode) {
      return `https://test.tamanu.io/${id}`;
    }

    return null;
  }
}
