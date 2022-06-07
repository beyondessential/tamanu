import { STRING, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.renameColumn('roles', 'createdAt', 'created_at');
  await query.renameColumn('roles', 'updatedAt', 'updated_at');
  await query.renameColumn('roles', 'deletedAt', 'deleted_at');

  await query.renameColumn('permissions', 'createdAt', 'created_at');
  await query.renameColumn('permissions', 'updatedAt', 'updated_at');
  await query.renameColumn('permissions', 'deletedAt', 'deleted_at');
  await query.renameColumn('permissions', 'objectId', 'object_id');
  await query.renameColumn('permissions', 'roleId', 'role_id');

  await query.changeColumn('permissions', 'role_id', {
    type: STRING,
    references: {
      model: 'roles',
      key: 'id',
    },
    allowNull: false,
  });
}

export async function down(query: QueryInterface) {
  await query.renameColumn('roles', 'created_at', 'createdAt');
  await query.renameColumn('roles', 'updated_at', 'updatedAt');
  await query.renameColumn('roles', 'deleted_at', 'deletedAt');

  await query.renameColumn('permissions', 'created_at', 'createdAt');
  await query.renameColumn('permissions', 'updated_at', 'updatedAt');
  await query.renameColumn('permissions', 'deleted_at', 'deletedAt');
  await query.renameColumn('permissions', 'object_id', 'objectId');
  await query.renameColumn('permissions', 'role_id', 'roleId');

  await query.changeColumn('permissions', 'roleId', {
    type: STRING,
    allowNull: false,
  });
}
