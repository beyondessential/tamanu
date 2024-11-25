/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';

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
    due_time: {
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
    completed_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    completed_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    completed_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    not_completed_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    not_completed_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    not_completed_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    todo_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    todo_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    todo_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deleted_by_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    deleted_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    deleted_reason_id: {
      type: DataTypes.STRING,
      allowNull: true,
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
      unique: true,
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
      type: DataTypes.UUID,
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
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.dropTable('user_designations');
  await query.dropTable('task_template_designations');
  await query.dropTable('task_templates');
  await query.dropTable('task_designations');
  await query.dropTable('tasks', {});
}
