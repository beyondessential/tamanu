import { MerlinProvider } from './merlin';
import { TestProvider } from './test';

export async function getImagingProvider(models) {
  const { Setting } = models;
  const config = await Setting.get('integrations.imaging');
  if (!config || !config.enabled) return false;

  switch (config.provider) {
    case 'test':
      return new MerlinProvider(models, config);

    case 'merlin':
      return new TestProvider(models, config);

    default:
      throw new Error(`unsupported provider: ${config.provider}`);
  }
}
