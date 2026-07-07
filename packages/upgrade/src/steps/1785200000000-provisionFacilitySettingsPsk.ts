import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_SETTINGS_PSK,
} from '@tamanu/constants';
import { END, needsMigration, type Steps, type StepArgs } from '../step.js';

const postJson = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
};

const getJson = async (url: string, token: string) => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
};

export const STEPS: Steps = [
  {
    at: END,
    // Needs the local_system_secrets table (at: END alone doesn't order after
    // migrations — the dependency does).
    after: [needsMigration('1782200000000-createLocalSystemSecretsTable.ts')],
    // Facilities configured before the settings PSK existed have sync credentials
    // but no PSK (fresh installs get it from the setup wizard, and config-credential
    // servers get it while provisioning their sync user). Pull it from central using
    // the stored sync credentials. Failure-tolerant: gated on the PSK fact, not
    // recorded as done, so it retries on the next upgrade if central is unreachable.
    // Gate on server type + already-configured (the sync email fact lives on the
    // long-lived local_system_facts table). The PSK-presence check is in run():
    // local_system_secrets may not exist when check() is evaluated during planning
    // (it's created by a migration in this same upgrade).
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      if (serverType !== 'facility') return false;
      return Boolean(await LocalSystemFact.get(FACT_SYNC_EMAIL));
    },
    async run({ models: { LocalSystemFact, LocalSystemSecret }, log }: StepArgs) {
      if (await LocalSystemSecret.get(FACT_SETTINGS_PSK)) return;

      const host = await LocalSystemFact.get(FACT_CENTRAL_HOST);
      const email = await LocalSystemFact.get(FACT_SYNC_EMAIL);
      const password = await LocalSystemSecret.get(FACT_SYNC_PASSWORD);
      const deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
      if (!host || !email || !password || !deviceId) {
        log.warn('provisionFacilitySettingsPsk: incomplete sync config; skipping');
        return;
      }

      const origin = new URL(host.trim()).origin;
      let settingsPsk: string | undefined;
      try {
        const { token } = await postJson(`${origin}/api/login`, { email, password, deviceId });
        ({ settingsPsk } = await getJson(`${origin}/api/admin/settingsPsk`, token));
      } catch (error) {
        log.warn(
          `provisionFacilitySettingsPsk: could not fetch the settings PSK (${
            (error as Error).message
          }); will retry on next upgrade`,
        );
        return;
      }

      if (!settingsPsk) {
        log.warn('provisionFacilitySettingsPsk: central returned no settings PSK; will retry');
        return;
      }

      await LocalSystemSecret.setIfAbsent(FACT_SETTINGS_PSK, settingsPsk);
      log.info('provisionFacilitySettingsPsk: settings PSK stored from central');
    },
  },
];
