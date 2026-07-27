import {
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  USER_KINDS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { initServerConfig } from '../serverConfig';

// Facilities configured before the setup wizard sync as a human admin, whose
// credentials came from config. Swap them for the dedicated per-device sync user
// central mints, so the deployment can tell a facility server apart from a person:
// central serves the settings PSK to kind:sync only. Runs on sync rather than on
// upgrade so a facility that was offline during its upgrade still converges.
export async function convergeSyncUser({ sequelize, models, centralServer }) {
  // Provisioning rotates the password, so only act on a positive answer: an
  // unknown kind means try again next sync, not rotate now.
  const kind = centralServer.user?.kind;
  if (!kind || kind === USER_KINDS.SYNC) return;

  const { LocalSystemFact, LocalSystemSecret } = models;
  const deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
  const storedFacilityIds = await LocalSystemFact.get(FACT_FACILITY_IDS);
  const facilityIds = storedFacilityIds ? JSON.parse(storedFacilityIds) : [];
  if (!deviceId || facilityIds.length === 0) {
    log.warn('convergeSyncUser: no device id or facility ids recorded; skipping');
    return;
  }

  const credentials = await centralServer.fetch('admin/syncCredentials', {
    method: 'POST',
    body: { deviceId, facilityIds },
  });

  // The response also carries the settings PSK, and storing it here would leave a
  // running process on whatever key it had already cached. pullSettingsPsk owns that
  // write and the cache invalidation that has to go with it, and runs straight after.
  await sequelize.transaction(async () => {
    await LocalSystemFact.set(FACT_SYNC_EMAIL, credentials.email);
    await LocalSystemSecret.set(FACT_SYNC_PASSWORD, credentials.password);
  });

  await initServerConfig({ context: { models } });
  // Drop the token so the next call authenticates as the user we just swapped to,
  // which is what the PSK read needs.
  centralServer.setToken('');
  log.info('convergeSyncUser: swapped config credentials for a dedicated sync user', {
    email: credentials.email,
  });
}
