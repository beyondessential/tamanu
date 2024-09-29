import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'errors', {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE sync_sessions SET errors = ARRAY[error]
    WHERE error IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'error');
}

export async function down(query) {
  await query.addColumn('sync_sessions', 'error', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE sync_sessions SET error = errors[1]
    WHERE errors IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'errors');
}
