import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex('location_assignments', ['date', 'location_id'], {
    name: 'idx_location_assignments_date_location_id',
    where: {
      deleted_at: null,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('location_assignments', 'idx_location_assignments_date_location_id');
}
