import config from 'config';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_SETTINGS_PSK,
} from '@tamanu/constants';
import { END, type Steps, type StepArgs } from '../step.js';

interface LegacySyncConfig {
  host?: string;
  email?: string;
  password?: string;
}

const legacySyncConfig = (): LegacySyncConfig => (config as { sync?: LegacySyncConfig }).sync ?? {};

const postJson = async (url: string, body: unknown, token?: string) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }
  return response.json();
};

export const STEPS: Steps = [
  {
    at: END,
    // Existing facility servers hold sync credentials in config; new ones get a
    // dedicated per-device sync user from the setup wizard. This converges the
    // existing servers: use the legacy credentials (their sync user is role
    // admin, so it may mint sync users) to provision a dedicated user on
    // central and record it in facts, so the deprecated config keys can be
    // dropped next version. Failure-tolerant: if central is unreachable or
    // refuses, the server stays on the config fallback and the step retries on
    // the next upgrade (it's gated on the email fact, not recorded as done).
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

      const deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
      const storedFacilityIds = await LocalSystemFact.get(FACT_FACILITY_IDS);
      const facilityIds: string[] = storedFacilityIds ? JSON.parse(storedFacilityIds) : [];
      if (!deviceId || facilityIds.length === 0) {
        // no device id / facilities recorded means the server never registered
        // with central — it's effectively unconfigured, leave it to the wizard
        log.warn('provisionSyncUser: no device id or facility ids recorded; skipping');
        return;
      }

      let credentials: { email: string; password: string; settingsPsk?: string };
      try {
        const { token } = await postJson(`${host}/api/login`, { email, password, deviceId });
        credentials = await postJson(
          `${host}/api/admin/syncCredentials`,
          { deviceId, facilityIds },
          token,
        );
      } catch (error) {
        log.warn(
          `provisionSyncUser: could not provision a dedicated sync user (${
            (error as Error).message
          }); staying on legacy config credentials, will retry on next upgrade`,
        );
        return;
      }

      await sequelize.transaction(async () => {
        await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
        await LocalSystemFact.set(FACT_SYNC_EMAIL, credentials.email);
        await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(facilityIds));
        // Password encrypted at rest, out of local_system_facts and the raw reporting role.
        await LocalSystemSecret.set(FACT_SYNC_PASSWORD, credentials.password);
        // Deployment-wide settings PSK from central (absent on older central).
        if (credentials.settingsPsk) {
          await LocalSystemSecret.setIfAbsent(FACT_SETTINGS_PSK, credentials.settingsPsk);
        }
      });
      log.info('provisionSyncUser: dedicated sync user provisioned', {
        email: credentials.email,
      });
    },
  },
];
