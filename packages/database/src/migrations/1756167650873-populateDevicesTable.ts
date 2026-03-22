import { QueryInterface } from 'sequelize';
import { SYSTEM_USER_UUID, DEVICE_SCOPES } from '@tamanu/constants';

// Note that we want to populate the column with an array with only the sync client scope
const INITIAL_DEVICE_SCOPES = [DEVICE_SCOPES.SYNC_CLIENT];

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO devices (id, last_seen_at, scopes, registered_by_id)
    SELECT device_id, now(), $deviceScopes, $systemUserUuid FROM sync_device_ticks GROUP BY device_id;
  `, {
    bind: {
      deviceScopes: JSON.stringify(INITIAL_DEVICE_SCOPES),
      systemUserUuid: SYSTEM_USER_UUID,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM devices;
  `);
}
