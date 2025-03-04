import { DataTypes, Sequelize, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'user_patient_intentional_views', schema: 'logs' };

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
        model: 'user',
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'patient',
        key: 'id',
      },
    },
    facility_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    logged_at: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    context: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable(TABLE);
}
