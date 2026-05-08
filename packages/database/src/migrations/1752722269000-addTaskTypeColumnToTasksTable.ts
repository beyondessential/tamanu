import { DataTypes, QueryInterface } from 'sequelize';
import { TASK_TYPES } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('tasks', 'task_type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: TASK_TYPES.NORMAL_TASK,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('tasks', 'task_type');
} 