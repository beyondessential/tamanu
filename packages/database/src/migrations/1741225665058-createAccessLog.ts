import { DataTypes, Sequelize, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'accesses', schema: 'logs' };

export async function up(query: QueryInterface) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: { tableName: 'users', schema: 'public' },
        key: 'id',
      },
    },
    record_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    record_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    facility_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: {
        model: { tableName: 'facilities', schema: 'public' },
        key: 'id',
      },
    },
    session_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    front_end_context: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    back_end_context: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    is_mobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    version: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable(TABLE);
}
