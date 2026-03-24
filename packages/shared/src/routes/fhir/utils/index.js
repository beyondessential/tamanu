import { log } from '../../../services/logging';

export * from './getHL7Link';
export * from './getBaseUrl';

export function resolveSettings(req) {
  const { settings, facilityId } = req;
  if (!settings) return undefined;
  if (typeof settings.get === 'function') return settings;
  if (facilityId && settings[facilityId]) return settings[facilityId];

  log.warn('FHIR resolveSettings: settings object present but could not be resolved', {
    hasFacilityId: !!facilityId,
    settingsKeys: Object.keys(settings),
  });
  return undefined;
}
