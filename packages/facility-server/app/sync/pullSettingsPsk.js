import { FACT_SETTINGS_PSK } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { clearSettingsPskCache } from '@tamanu/shared/utils/crypto';

// Central owns the deployment-wide settings PSK and facilities pull it: settings
// sync central→facility, so a per-host key can't decrypt cross-server secrets.
// Runs off the back of a completed sync session, where central is reachable and
// the connection is already authenticated.
export async function pullSettingsPsk({ models: { LocalSystemSecret }, centralServer }) {
  if (await LocalSystemSecret.get(FACT_SETTINGS_PSK)) return;

  const { settingsPsk } = await centralServer.fetch('admin/settingsPsk');
  // Falsy rather than == null, unlike the read path in crypto.js: this one writes, and
  // setIfAbsent would make an empty value permanent and break every secret read until
  // someone clears the row. Refuse it and pick it up on the next sync.
  if (!settingsPsk) {
    log.warn('pullSettingsPsk: central returned no settings PSK');
    return;
  }

  await LocalSystemSecret.setIfAbsent(FACT_SETTINGS_PSK, settingsPsk);
  // An earlier read may have cached a key buffer from the config fallback; drop
  // it so this PSK is used without a restart.
  clearSettingsPskCache();
  log.info('pullSettingsPsk: settings PSK stored from central');
}
