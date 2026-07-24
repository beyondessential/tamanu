import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Primary win: the clinician Tasks dashboard (GET /api/v1/user/tasks) filters
  // `WHERE status = 'todo' AND due_time <= now() + <window>` and orders by due_time.
  // Without this index that query does a full sequential scan of the tasks table.
  await query.addIndex('tasks', ['status', 'due_time']);

  // Supporting index on the (previously unindexed) encounter_id foreign key, which the
  // same query uses for its INNER join from tasks to encounters.
  await query.addIndex('tasks', ['encounter_id']);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('tasks', ['encounter_id']);
  await query.removeIndex('tasks', ['status', 'due_time']);
}
