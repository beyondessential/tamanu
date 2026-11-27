import { SETTINGS_SCOPES } from '@tamanu/constants';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { pauseAudit } from '@tamanu/database/utils/audit';

// Global settings that didn't come from central were added by migrations on this server, and
// central's copies of the same keys can't be saved by the first sync while they're here. Settings
// central has already sent are kept, so setting a server up again doesn't lose them.
export async function clearLocallyAuthoredSettings(sequelize) {
  // Otherwise the changelog would keep a copy of every deleted row, including secret values.
  await pauseAudit(sequelize);
  await sequelize.query(
    `DELETE FROM settings
    WHERE scope = :global AND facility_id IS NULL AND updated_at_sync_tick <> :fromCentral`,
    {
      replacements: {
        global: SETTINGS_SCOPES.GLOBAL,
        fromCentral: SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE,
      },
    },
  );
}
