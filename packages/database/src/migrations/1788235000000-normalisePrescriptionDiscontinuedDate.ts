import { QueryInterface, QueryTypes } from 'sequelize';

// Migration 1 of 2: Normalise data (DML)
// Separated from the schema change to avoid "pending trigger events" error --
// record_prescriptions_changelog is a deferred constraint trigger, so an UPDATE here queues
// events that would make an ALTER TABLE in the same transaction fail.

const CANONICAL = String.raw`^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$`;
const DATE_LIKE = String.raw`^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])`;

export async function up(query: QueryInterface): Promise<void> {
  // date_time_string is character(19), so anything not in the canonical form has to be resolved
  // before the type change. Normalise first, so a real timestamp written in another shape --
  // date only, minute precision, an ISO offset -- is preserved rather than discarded.
  await query.sequelize.query(`
    UPDATE prescriptions
    SET discontinued_date = to_char(discontinued_date::timestamp, 'YYYY-MM-DD HH24:MI:SS')
    WHERE discontinued_date IS NOT NULL
      AND discontinued_date !~ '${CANONICAL}'
      AND discontinued_date ~ '${DATE_LIKE}'
  `);

  // DESTRUCTIVE: whatever is left is not a date and is cleared. Every write path produces
  // getCurrentDateTimeString or a toDateTimeString round trip -- both canonical -- or null, so
  // this only clears values no code path could have written. Seeded databases are the case that
  // has them: fake-data fills varchar(255) columns with `Prescription.discontinuedDate.<id>`.
  await query.sequelize.query(`
    UPDATE prescriptions
    SET discontinued_date = NULL
    WHERE discontinued_date IS NOT NULL
      AND discontinued_date !~ '${CANONICAL}'
  `);

  // Fail here rather than in the next migration, where the same problem surfaces as an opaque
  // "value too long for type character(19)".
  const remaining: any = await query.sequelize.query(
    `SELECT COUNT(*) as count FROM prescriptions
     WHERE discontinued_date IS NOT NULL AND discontinued_date !~ '${CANONICAL}'`,
    { type: QueryTypes.SELECT },
  );

  const count = parseInt(remaining[0].count, 10);
  if (count > 0) {
    throw new Error(
      `Cannot narrow discontinued_date to date_time_string: ${count} prescription(s) still hold ` +
        `a value that is neither null nor a canonical date-time string.`,
    );
  }
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: normalising and clearing cannot be reversed -- the original values are not
  // recorded anywhere this migration can read back.
}
