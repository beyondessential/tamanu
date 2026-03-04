import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex('user_designations', {
    name: 'user_designations_user_id_deleted_at_null_idx',
    fields: ['user_id'],
    where: {
      deleted_at: null,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('user_designations', 'user_designations_user_id_deleted_at_null_idx');
}
