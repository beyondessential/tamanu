import { DataTypes, QueryInterface } from 'sequelize';

// prescriptions.discontinued_date was declared DataTypes.STRING while every other date on the
// model uses dateTimeType, so it was created as varchar(255) and gets none of the normalisation
// the setter provides. Bring it onto the date_time_string domain like date, start_date and
// end_date, which is also what the mobile model already declares it as.

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

  await query.changeColumn('prescriptions', 'discontinued_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // Widening back to varchar(255) always succeeds, but the values cleared by `up` are not
  // recoverable from this migration.
  await query.changeColumn('prescriptions', 'discontinued_date', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
