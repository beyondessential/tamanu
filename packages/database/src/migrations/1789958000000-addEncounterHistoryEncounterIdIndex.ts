import { QueryInterface } from 'sequelize';

// encounter_history carries only its updated_at_sync_tick index, so every query
// that reaches an encounter's movement history scans the whole table. On Aspen
// (1.8M history rows) the encounter summary report was doing a Parallel Seq Scan
// of 1,806,011 rows to keep 1,385, measured at ~766ms of a 13.5s run:
//
//   ->  Hash Join  (actual rows=1385)
//         Hash Cond: ((eh.encounter_id)::text = (eis.encounter_id)::text)
//         ->  Gather  (actual rows=1806011)
//               ->  Parallel Seq Scan on encounter_history eh
//
// The same scan sits behind every encounter-scoped consumer of the history, not
// just that report: the admissions dataset, the discharge audit, and the
// facility-server encounter history endpoint all join on encounter_id alone.
//
// Measured on a 210k-row fixture, the same join went from 59ms to 1.8ms.
//
// MAUI-6917.
const INDEXES: [name: string, definition: string][] = [
  ['encounter_history_encounter_id', 'ON encounter_history (encounter_id)'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [name, definition] of INDEXES) {
    await query.sequelize.query(`CREATE INDEX IF NOT EXISTS ${name} ${definition};`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const [name] of INDEXES) {
    await query.sequelize.query(`DROP INDEX IF EXISTS ${name};`);
  }
}
