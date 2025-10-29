import Sequelize from 'sequelize';

// TODO: DEPRECATED - This migration added columns to encounter_history table which will be removed
// after migrating data to logs.changes table
export async function up(query) {
  await query.addColumn('encounter_history', 'actor_id', {
    type: Sequelize.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: true,
  });

  await query.addColumn('encounter_history', 'change_type', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('encounter_history', 'actor_id');
  await query.removeColumn('encounter_history', 'change_type');
}
