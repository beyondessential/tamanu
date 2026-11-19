import { QueryInterface } from 'sequelize';

// get_medication_time_slot returns exactly one row, but as a set-returning function it carried
// Postgres's default estimate of 1000. The dashboard tasks query (GET /user/tasks) lateral-joins
// it inside a per-task EXISTS, and the inflated estimate made the planner pick a merge anti-join
// that reads encounter_prescriptions in primary-key order, filtering the whole table for every
// task instead of using its encounter_id index. With tens of thousands of medication tasks the
// count took minutes and the request timed out; with the true estimate it takes under a second.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER FUNCTION public.get_medication_time_slot(timestamp without time zone) ROWS 1;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER FUNCTION public.get_medication_time_slot(timestamp without time zone) ROWS 1000;
  `);
}
