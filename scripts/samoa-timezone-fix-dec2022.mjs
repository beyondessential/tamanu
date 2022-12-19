// Run inside sync-server shell by:
// > tzfix = await import('../../scripts/samoa-timezone-fix-dec2022.mjs');
// > await tzfix.run(store);

import { Sequelize, DataTypes, Op } from 'sequelize';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const ISO9075_DATE_FMT = 'YYYY-MM-DD';

const dateTableColumns = Object.entries({
  appointments: ['start_time', 'end_time'],
  lab_requests: ['sample_time', 'requested_date'],
  patients: ['date_of_death'],
  triages: ['arrival_time', 'triage_time', 'closed_time'],
}).flatMap(([t, cs]) => cs.map(c => [t, c]));

const dateTimeTableColumns = Object.entries({
  administered_vaccines: ['date'],
  encounter_diagnoses: ['date'],
  encounter_medications: ['date', 'end_date'],
  encounters: ['start_date', 'end_date'],
  imaging_requests: ['requested_date'],
  invoice_line_items: ['date_generated'],
  invoice_price_change_items: ['date'],
  invoices: ['date'],
  note_items: ['date'],
  note_pages: ['date'],
  patient_allergies: ['recorded_date'],
  patient_care_plans: ['date'],
  patient_conditions: ['recorded_date'],
  patient_death_data: ['external_cause_date', 'last_surgery_date'],
  patient_family_histories: ['recorded_date'],
  patient_issues: ['recorded_date'],
  procedures: ['date', 'start_time', 'end_time'],
  vitals: ['date_recorded'],
}).flatMap(([t, cs]) => cs.map(c => [t, c]));

export async function run(store) {
  const { sequelize: { query, transaction } } = store;

  // Theory of operation:
  // - server was misconfigured at UTC-11 (Pacific/Samoa)
  // - dates were input as `YYYY-MM-DD HH:MM:SS` into timestamptz columns, thus interpreted as UTC
  // - so a date input `2022-02-03 00:00:00` was stored as `2022-02-02 13:00:00-11`
  // - migration to datestrings freezes this as `2022-02-02` -- one day off!
  // - we take the legacy timestamp and render it as UTC, so it becomes `2022-02-03 00:00:00` again -- the original input!
  // - then we use that with to_char() to extract as strings `2022-02-03 00:00:00` and `2022-02-03` as required.
  //
  // - the WHERE: as we've reconfigured the server correctly, we hardcode the old wrong timezone for detection.

  await transaction(async () => {
    for (const [tableName, columnName] of dateTimeTableColumns) {
      await query(`
        UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_TIME_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_TIME_FMT}');
      `);
    }

    for (const [tableName, columnName] of dateTableColumns) {
      await query(`
        UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_FMT}');
      `);
    }

    // DOB gets special handling:
    // - if any test or vaccination certificates were issued, don't touch, it's correct
    //   - only types of certificates issued in samoa were those, so just match presence in table
    // - otherwise, fix as above
    await query(`
        UPDATE patients
        SET date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_FMT}')
          AND id NOT IN (
            SELECT DISTINCT p.id FROM patients p JOIN certificate_notifications cn ON cn.patient_id = p.id
          );
      `);
  });
}
