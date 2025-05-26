import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'parameters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  // Move parameters from debugInfo to new parameters column
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET parameters = jsonb_build_object(
          'minSourceTick', debug_info->'minSourceTick',
          'maxSourceTick', debug_info->'maxSourceTick',
          'isMobile', COALESCE(debug_info->'isMobile', false)
        )
    WHERE debug_info IS NOT NULL
    AND (debug_info::jsonb ? 'minSourceTick' OR debug_info::jsonb ? 'maxSourceTick' OR debug_info::jsonb ? 'isMobile');
  `);

  // Remove migrated fields from debugInfo
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET debug_info = debug_info::jsonb - 'minSourceTick' - 'maxSourceTick' - 'isMobile'
    WHERE parameters IS NOT NULL;
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
