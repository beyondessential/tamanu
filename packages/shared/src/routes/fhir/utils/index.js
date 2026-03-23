export * from './getHL7Link';
export * from './getBaseUrl';

export function resolveSettings(req) {
  const { settings, facilityId } = req;
  if (!settings) return undefined;
  if (typeof settings.get === 'function') return settings;
  if (facilityId && settings[facilityId]) return settings[facilityId];
  return undefined;
}
