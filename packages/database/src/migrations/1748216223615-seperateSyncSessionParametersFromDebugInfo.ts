import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'parameters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE sync_sessions
    SET
      parameters = (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(debug_info::jsonb)
        WHERE key IN ('minSourceTick', 'maxSourceTick', 'isMobile')
      ),
      debug_info = (
        SELECT json_object_agg(key, value)
        FROM json_each(debug_info)
        WHERE key NOT IN ('minSourceTick', 'maxSourceTick', 'isMobile')
      )
    WHERE debug_info IS NOT NULL
    AND (debug_info::jsonb ? 'minSourceTick' OR debug_info::jsonb ? 'maxSourceTick' OR debug_info::jsonb ? 'isMobile');
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET debug_info = COALESCE(debug_info::jsonb, '{}'::jsonb) || parameters
    WHERE parameters IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'parameters');
}