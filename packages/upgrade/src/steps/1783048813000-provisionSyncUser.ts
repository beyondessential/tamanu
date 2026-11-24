import config from 'config';
import {
  FACT_CENTRAL_HOST,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';
import { facilityIdsFromEnv, selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { END, type Steps, type StepArgs } from '../step.js';

interface LegacySyncConfig {
  host?: string;
  email?: string;
  password?: string;
}

const legacySyncConfig = (): LegacySyncConfig => (config as { sync?: LegacySyncConfig }).sync ?? {};

export const STEPS: Steps = [
  {
    at: END,
    // copy the sync credentials from the config file into facts as they are. this doesn't need
    // central, so it works when the facility is offline for its upgrade.
    // swapping them for a sync user does need central, so convergeSyncUser does that during sync
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      if (serverType !== 'facility') return false;
      const { host, email, password } = legacySyncConfig();
      // nothing to migrate — fresh installs are configured by the wizard
      if (!host || !email || !password) return false;
      return !(await LocalSystemFact.get(FACT_SYNC_EMAIL));
    },
    async run({ sequelize, models: { LocalSystemFact, LocalSystemSecret }, log }: StepArgs) {
      const { host: legacyHost, email, password } = legacySyncConfig();
      const host = new URL(legacyHost!.trim()).origin;
      const facilityIds = facilityIdsFromEnv() ?? selectFacilityIds(config);

      await sequelize.transaction(async () => {
        await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
        await LocalSystemFact.set(FACT_SYNC_EMAIL, email!);
        // Encrypted at rest, out of local_system_facts and the raw reporting role.
        await LocalSystemSecret.set(FACT_SYNC_PASSWORD, password!);
        // Without this fact the boot integrity check logs in to central to stamp it,
        // so a bad credential leaves the server unable to start; convergeSyncUser
        // needs it too.
        if (facilityIds?.length) {
          await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(facilityIds));
        }
      });
      log.info('provisionSyncUser: legacy sync credentials recorded to facts');
    },
  },
];
