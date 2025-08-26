import { QueryInterface } from 'sequelize';
import { SYSTEM_USER_UUID, DEVICE_SCOPES } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO devices (id, last_seen_at, scopes, registered_by_id)
    SELECT device_id, now(), '["${DEVICE_SCOPES.SYNC_CLIENT}"]'::jsonb, '${SYSTEM_USER_UUID}' FROM sync_device_ticks GROUP BY device_id;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM devices;
  `);
}
