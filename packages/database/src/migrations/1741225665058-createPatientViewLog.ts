import { DataTypes, Sequelize, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'user_patient_views', schema: 'logs' };

export async function up(query: QueryInterface) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    viewed_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: { tableName: 'users', schema: 'public' },
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: { tableName: 'patients', schema: 'public' },
        key: 'id',
      },
    },
    facility_id: {
      type: DataTypes.STRING,
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
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    context: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable(TABLE);
}
