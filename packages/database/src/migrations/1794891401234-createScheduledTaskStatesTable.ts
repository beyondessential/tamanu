import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'scheduled_task_states', schema: 'public' };

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.STRING,
      defaultValue: query.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    running_since: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex(TABLE, ['name'], {
    unique: true,
    name: 'scheduled_task_states_name',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
