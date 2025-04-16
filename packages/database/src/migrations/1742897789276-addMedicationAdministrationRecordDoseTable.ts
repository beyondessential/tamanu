import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('medication_administration_record_doses', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    dose_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    given_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    given_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recorded_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    medication_administration_record_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('medication_administration_record_doses');
}
