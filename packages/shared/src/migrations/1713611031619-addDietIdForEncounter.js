import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'diet_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addConstraint('encounters', {
    name: 'encounters_diet_id_fkey',
    fields: ['diet_id'],
    type: 'foreign key',
    references: {
      table: 'reference_data',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeConstraint('encounters', 'encounters_diet_id_fkey');
  await query.removeColumn('encounters', 'diet_id');
}
