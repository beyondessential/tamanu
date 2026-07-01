import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'local_system_secrets', schema: 'public' };

// Holds sensitive server-only values (device key, reporting-role secret) kept
// out of local_system_facts so the read-only `raw` reporting role can be
// excluded from them. Structure mirrors local_system_facts.
export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.STRING,
      defaultValue: query.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
  await query.addIndex(TABLE, ['key'], {
    unique: true,
    name: 'local_system_secrets_key',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
