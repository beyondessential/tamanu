import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('task_encounter_prescriptions', {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      }
    },
    encounter_prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'encounter_prescriptions',
        key: 'id',
      }
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
    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: -999,
    },
  });

  await query.addIndex('task_encounter_prescriptions', ['task_id', 'encounter_prescription_id'], {
    unique: true,
    name: 'task_encounter_prescriptions_task_encounter_unique',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('task_encounter_prescriptions');
} 