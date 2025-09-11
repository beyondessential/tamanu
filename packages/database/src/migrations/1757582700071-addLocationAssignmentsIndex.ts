import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex('location_assignments', ['location_id', 'date'], {
    name: 'idx_location_assignments_location_id_date',
    where: {
      deleted_at: null,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('location_assignments', 'idx_location_assignments_location_id_date');
}
