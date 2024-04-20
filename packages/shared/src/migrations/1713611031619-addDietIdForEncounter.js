import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'diet_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addConstraint('encounters', {
    fields: ['diet_id'],
    type: 'foreign key',
    references: {
      table: 'reference_data',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('encounters', 'diet_id');
}
