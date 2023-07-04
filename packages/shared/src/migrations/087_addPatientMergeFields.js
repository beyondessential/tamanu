import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('patients', 'merged_into_id', {
    type: Sequelize.STRING,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id',
    },
  });

  await query.addColumn('patients', 'visibility_status', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'current',
  });
}

export async function down(query) {
  await query.removeColumn('patients', 'merged_into_id');
  await query.removeColumn('patients', 'visibility_status');
}
