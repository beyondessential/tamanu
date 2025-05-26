import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'parameters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  // Migrate existing data from debugInfo to parameters
  await query.sequelize.query(`
    UPDATE sync_sessions
    SET parameters =
      COALESCE(
        CASE WHEN debug_info->'minSourceTick' IS NOT NULL THEN jsonb_build_object('minSourceTick', debug_info->'minSourceTick') ELSE '{}'::jsonb END ||
        CASE WHEN debug_info->'maxSourceTick' IS NOT NULL THEN jsonb_build_object('maxSourceTick', debug_info->'maxSourceTick') ELSE '{}'::jsonb END ||
        CASE WHEN debug_info->'isMobile' IS NOT NULL THEN jsonb_build_object('isMobile', debug_info->'isMobile') ELSE '{}'::jsonb END ||
        '{}'::jsonb
      ),
    debug_info = (
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
    SET debug_info = COALESCE(debug_info::jsonb, '{}'::jsonb) || parameters
    WHERE parameters IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'parameters');
}