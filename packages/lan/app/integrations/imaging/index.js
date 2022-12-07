import * as merlin from './merlin';
import * as test from './test';

class Provider {
  constructor(models, name, config) {
    this.models = models;
    this.name = name;
    this.config = config;
  }

  getUrlForResult(result) {
    switch (this.name) {
      case 'test':
        return test.getUrlForResult(this.models, this.config, result);

      case 'merlin':
        return merlin.getUrlForResult(this.models, this.config, result);

      default:
        throw new Error(`unsupported provider: ${this.name}`);
    }
  }
}

export async function getImagingProvider(models) {
  const { Setting } = models;
  const config = await Setting.get('integrations.imaging');
  if (!config || !config.enabled) return false;

  switch (config.provider) {
    case 'test':
      return new Provider(models, 'test', config);

    case 'merlin':
      return new Provider(models, 'merlin', config);

    default:
      throw new Error(`unsupported provider: ${config.provider}`);
  }
}
