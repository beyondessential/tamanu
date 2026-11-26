import { log } from '../../../services/logging';

export * from './getHL7Link';
export * from './getBaseUrl';

export function resolveSettings(req) {
  const { settings, facilityId } = req;
  if (!settings) return undefined;
  if (typeof settings.get === 'function') return settings;
  if (facilityId && settings[facilityId]) return settings[facilityId];

  if (settings.global) {
    // a request with no facility (e.g. a device-less FHIR integration login on a
    // multi-facility server) is expected; one whose facility has no reader is a misconfiguration
    if (facilityId) {
      log.warn('FHIR resolveSettings: no settings for facility, using global settings', {
        facilityId,
        settingsKeys: Object.keys(settings),
      });
    }
    return settings.global;
  }

  log.warn('FHIR resolveSettings: settings object present but could not be resolved', {
    hasFacilityId: Boolean(facilityId),
    settingsKeys: Object.keys(settings),
  });
  return undefined;
}
