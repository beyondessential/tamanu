import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'parameters', {
    type: DataTypes.JSON,
    allowNull: true,
  });

  // Migrate existing data from debugInfo to parameters
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET parameters = json_build_object(
      'minSourceTick', debug_info->'minSourceTick',
      'maxSourceTick', debug_info->'maxSourceTick',
      'isMobile', debug_info->'isMobile'
    )
    WHERE debug_info IS NOT NULL
    AND (
      debug_info->'minSourceTick' IS NOT NULL OR
      debug_info->'maxSourceTick' IS NOT NULL OR
      debug_info->'isMobile' IS NOT NULL
    );
  `);

    // Remove the migrated fields from debugInfo by reconstructing without those keys
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET debug_info = (
      SELECT json_object_agg(key, value)
      FROM json_each(debug_info)
      WHERE key NOT IN ('minSourceTick', 'maxSourceTick', 'isMobile')
    )
    WHERE debug_info IS NOT NULL
    AND (
      debug_info->'minSourceTick' IS NOT NULL OR
      debug_info->'maxSourceTick' IS NOT NULL OR
      debug_info->'isMobile' IS NOT NULL
    );
  `);
}

export async function down(query: QueryInterface): Promise<void> {
    // Move data back from parameters to debugInfo
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET debug_info = COALESCE(debug_info, '{}'::json) ||
      COALESCE(parameters, '{}'::json)
    WHERE parameters IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'parameters');
}
