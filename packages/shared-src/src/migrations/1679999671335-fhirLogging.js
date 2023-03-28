import { Sequelize, DataTypes } from 'sequelize';

const TABLE = { tableName: 'fhir_writes', schema: 'logs' };

export async function up(query) {
  await query.createSchema(TABLE.schema);
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('current_timestamp', 6),
    },
    verb: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    body: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    headers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: { tableName: 'users', schema: 'public' },
        key: 'id',
      },
    },
  });

  await query.addIndex(TABLE, { fields: ['headers'], using: 'gin' });
  await query.addIndex(TABLE, { fields: ['url'] });
  await query.addIndex(TABLE, { fields: ['verb'] });
}

export async function down(query) {
  await query.dropTable(TABLE);
  await query.dropSchema(TABLE.schema);
}
