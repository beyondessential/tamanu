import { SETTING_KEYS } from '@tamanu/constants';
import { MerlinProvider } from './MerlinProvider';
import { TestProvider } from './TestProvider';

export async function getImagingProvider(models) {
  const { Setting } = models;
  const config = await Setting.get(SETTING_KEYS.INTEGRATIONS_IMAGING);
  if (!config || !config.enabled) return false;

  switch (config.provider) {
    case 'test':
      return new TestProvider(models, config);

    case 'merlin':
      return new MerlinProvider(models, config);

    default:
      throw new Error(`unsupported provider: ${config.provider}`);
  }
}
