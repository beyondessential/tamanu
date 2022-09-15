export async function up(query) {
  await query.renameColumn('roles', 'createdAt', 'created_at');
  await query.renameColumn('roles', 'updatedAt', 'updated_at');
  await query.renameColumn('roles', 'deletedAt', 'deleted_at');

  await query.renameColumn('permissions', 'createdAt', 'created_at');
  await query.renameColumn('permissions', 'updatedAt', 'updated_at');
  await query.renameColumn('permissions', 'deletedAt', 'deleted_at');
  await query.renameColumn('permissions', 'objectId', 'object_id');
  await query.renameColumn('permissions', 'roleId', 'role_id');

  await query.addConstraint('permissions', {
    type: 'foreign key',
    name: 'permissions_role_id_fkey',
    fields: ['role_id'],
    references: {
      table: 'roles',
      field: 'id',
    },
    // Postgres defaults, which seem to match our database at the moment of writing this
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

export async function down(query) {
  await query.removeConstraint('permissions', 'permissions_role_id_fkey');

  await query.renameColumn('roles', 'created_at', 'createdAt');
  await query.renameColumn('roles', 'updated_at', 'updatedAt');
  await query.renameColumn('roles', 'deleted_at', 'deletedAt');

  await query.renameColumn('permissions', 'created_at', 'createdAt');
  await query.renameColumn('permissions', 'updated_at', 'updatedAt');
  await query.renameColumn('permissions', 'deleted_at', 'deletedAt');
  await query.renameColumn('permissions', 'object_id', 'objectId');
  await query.renameColumn('permissions', 'role_id', 'roleId');
}
