import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('medication_administration_record_doses', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
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
    mar_id: {
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
