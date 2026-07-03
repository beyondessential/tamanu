import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

/**
 * Reader for server-wide settings that support facility-scope overrides
 * (auth.tokenDuration, rateLimit). These are read once per server — at login or
 * app build — where no single request facility applies, so they resolve through
 * the first configured facility's reader (the same first-facility precedent as
 * resolveSchedules). Falls back to the global reader in contexts without
 * facility readers.
 */
export const serverScopedSettings = settings => {
  const [facilityId] = selectFacilityIds(config) ?? [];
  return (facilityId && settings?.[facilityId]) || settings?.global || settings;
};
