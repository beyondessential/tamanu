/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize, Op } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.createTable('tasks', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    requested_by_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    request_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'todo',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    frequency_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    frequency_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    high_priority: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    parent_task_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('task_designations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    designation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('task_templates', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    reference_data_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    high_priority: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    frequency_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    frequency_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('task_template_designations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    task_template_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'task_templates',
        key: 'id',
      },
    },
    designation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('user_designations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    designation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex('tasks', ['start_time', 'parent_task_id'], {
    where: { deleted_at: null, parent_task_id: { [Op.ne]: null } },
    unique: true,
    name: 'start_time_in_sequence_unique',
  });

  await query.addIndex('task_designations', ['task_id', 'designation_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'task_designation_unique',
  });

  await query.addIndex('task_template_designations', ['task_template_id', 'designation_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'task_template_designation_unique',
  });

  await query.addIndex('user_designations', ['user_id', 'designation_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'user_designation_unique',
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeIndex('tasks', 'start_time_in_sequence_unique');
  await query.removeIndex('task_designations', 'task_designation_unique');
  await query.removeIndex('task_template_designations', 'task_template_designation_unique');
  await query.removeIndex('user_designations', 'user_designation_unique');

  await query.dropTable('user_designations');
  await query.dropTable('task_template_designations');
  await query.dropTable('task_templates');
  await query.dropTable('task_designations');
  await query.dropTable('tasks');
}
