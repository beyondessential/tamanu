import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('discharges', 'disposition_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('discharges', 'disposition_id');
}
