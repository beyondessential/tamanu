import { DataTypes, Sequelize, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'm_supply_pushes', schema: 'logs' };

export async function up(query: QueryInterface) {
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
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    min_medication_created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_medication_created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    min_medication_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    max_medication_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable(TABLE);
}
