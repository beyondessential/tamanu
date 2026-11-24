import {
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  USER_KINDS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { initServerConfig } from '../serverConfig';

// a facility that was set up from the config file syncs as a person's admin account. central only
// gives the settings PSK (the pre-shared key that secret settings are encrypted with) to a sync
// user, so swap to the sync user it creates for this device.
// this happens during sync so that a facility that was offline for its upgrade still gets swapped
export async function convergeSyncUser({ sequelize, models, centralServer }) {
  // Provisioning rotates the password, so only act on a positive answer: an
  // unknown kind means try again next sync, not rotate now.
  const { kind, email: authenticatedAs } = centralServer.user ?? {};
  if (!kind || kind === USER_KINDS.SYNC) return;

  const { LocalSystemFact, LocalSystemSecret } = models;

  // if the recorded account isn't the one we're logged in as, the swap has already been done and
  // this process is still using the credentials it read when it started. provisioning again would
  // rotate the password on every sync
  const recordedEmail = await LocalSystemFact.get(FACT_SYNC_EMAIL);
  if (recordedEmail && recordedEmail !== authenticatedAs) return;

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
  if (!credentials?.email || !credentials?.password) {
    throw new Error('admin/syncCredentials returned no email or password');
  }

  // the response includes the settings PSK as well, but we leave that for pullSettingsPsk, which
  // runs straight after this and clears the cached key when it stores the new one
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
