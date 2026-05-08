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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recorded_by_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    mar_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'medication_administration_records',
        key: 'id',
      },
    },
    dose_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_removed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    reason_for_removal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason_for_change: {
      type: DataTypes.STRING,
      allowNull: true,
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

  await query.addIndex('medication_administration_record_doses', ['mar_id']);
  await query.addIndex('medication_administration_record_doses', ['dose_index']);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('medication_administration_record_doses', ['dose_index']);
  await query.removeIndex('medication_administration_record_doses', ['mar_id']);
  await query.dropTable('medication_administration_record_doses');
}
