import { STRING, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('discharges', 'disposition_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('discharges', 'disposition_id');
}
