import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('appointments', 'additional_clinician_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('appointments', 'additional_clinician_id');
}
