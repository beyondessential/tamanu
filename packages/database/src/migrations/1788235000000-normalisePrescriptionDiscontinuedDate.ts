import { QueryInterface } from 'sequelize';

// Migration 1 of 2: normalise the data (DML)
// record_prescriptions_changelog is a deferred constraint trigger, so an UPDATE here queues
// events that would make the next migration's ALTER TABLE fail in the same transaction.

export async function up(query: QueryInterface): Promise<void> {
  // Only a cast can tell a real timestamp from junk: no pattern knows that 2024-02-30 is not a
  // date. It raises rather than returning null, so it is wrapped, otherwise one bad value stops
  // the upgrade.
  await query.sequelize.query(`
    CREATE FUNCTION normalise_prescription_discontinued_date(value text)
    RETURNS text AS $$
    BEGIN
      RETURN to_char(value::timestamp, 'YYYY-MM-DD HH24:MI:SS');
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END
    $$ LANGUAGE plpgsql;
  `);

  // DESTRUCTIVE: anything that is not a date becomes null, since date_time_string is
  // character(19) and the value cannot be kept. A real timestamp written in another shape (date
  // only, minute precision, an ISO offset) normalises rather than being discarded. Values already
  // canonical normalise to themselves, so they are left out and neither the changelog nor FHIR
  // rematerialisation sees the whole table.
  await query.sequelize.query(`
    UPDATE prescriptions
    SET discontinued_date = normalise_prescription_discontinued_date(discontinued_date)
    WHERE discontinued_date IS NOT NULL
      AND discontinued_date IS DISTINCT FROM normalise_prescription_discontinued_date(discontinued_date)
  `);

  await query.sequelize.query(`DROP FUNCTION normalise_prescription_discontinued_date(text)`);
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: normalising and clearing cannot be reversed. The original values are not
  // recorded anywhere this migration can read back.
}
