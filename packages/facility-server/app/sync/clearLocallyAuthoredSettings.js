import { SETTINGS_SCOPES } from '@tamanu/constants';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { pauseAudit } from '@tamanu/database/utils/audit';

// Rows central never sent were seeded by migrations, and collide by key with central's copies.
// Must run inside the caller's transaction, so the rows go only if their replacements land.
export async function clearLocallyAuthoredSettings(sequelize) {
  // Unpaused, the changelog would record each deleted row, secret included.
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
