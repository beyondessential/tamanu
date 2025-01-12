import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'referral_source_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('encounters', 'referral_source_id');
}
