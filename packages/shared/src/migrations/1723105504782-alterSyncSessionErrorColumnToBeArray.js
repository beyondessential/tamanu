import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'errors', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE sync_sessions SET errors = ARRAY[error]
    WHERE error IS NOT NULL;
  `);

  await query.removeColumn('sync_sessions', 'error');
}

export async function down(query) {
  // Will not be able to revert to the original state (single error column)
  // anymore when errors column contain multiple errors.
}
