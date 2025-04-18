import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('medication_administration_records', {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    due_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    recorded_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    recorded_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    prescription_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    reason_not_given_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    is_auto_generated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  await query.dropTable('medication_administration_records');
}
