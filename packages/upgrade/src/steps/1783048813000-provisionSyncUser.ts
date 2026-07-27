import config from 'config';
import { FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_SYNC_PASSWORD } from '@tamanu/constants';
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
    // Copy the legacy config credentials into facts verbatim. Local writes only, so
    // it can't fail — the config fallback can only go once every server is guaranteed
    // to have these. Swapping them for a dedicated sync user needs central, so it
    // rides a sync session instead (facility-server convergeSyncUser).
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

      await sequelize.transaction(async () => {
        await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
        await LocalSystemFact.set(FACT_SYNC_EMAIL, email!);
        // Encrypted at rest, out of local_system_facts and the raw reporting role.
        await LocalSystemSecret.set(FACT_SYNC_PASSWORD, password!);
      });
      log.info('provisionSyncUser: legacy sync credentials recorded to facts');
    },
  },
];
