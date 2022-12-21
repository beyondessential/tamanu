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
  // Theory of operation:
  // - server was misconfigured at UTC-11 (Pacific/Samoa)
  // - dates were input as `YYYY-MM-DD HH:MM:SS` into timestamptz columns, thus interpreted as UTC
  // - so a date input `2022-02-03 00:00:00` was stored as `2022-02-02 13:00:00-11`
  // - migration to datestrings freezes this as `2022-02-02` -- one day off!
  // - we take the legacy timestamp and render it as UTC, so it becomes `2022-02-03 00:00:00` again -- the original input!
  // - then we use that with to_char() to extract as strings `2022-02-03 00:00:00` and `2022-02-03` as required.
  //
  // - the WHERE: as we've reconfigured the server correctly, we hardcode the old wrong timezone for detection.

  console.time('script');
  await store.sequelize.transaction(async () => {
    for (const [tableName, columnName] of dateTimeTableColumns) {
      console.log(`${tableName}.${columnName}...`);
      console.time(`${tableName}.${columnName}`);
      await store.sequelize.query(`
        UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_TIME_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE ${columnName}_legacy IS NOT NULL
          AND ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_TIME_FMT}');
      `);
      console.timeEnd(`${tableName}.${columnName}`);
    }

    for (const [tableName, columnName] of dateTableColumns) {
      console.log(`${tableName}.${columnName}...`);
      console.time(`${tableName}.${columnName}`);
      await store.sequelize.query(`
        UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE ${columnName}_legacy IS NOT NULL
          AND ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_FMT}');
      `);
      console.timeEnd(`${tableName}.${columnName}`);
    }

    // DOB gets special handling:
    // - if any test or vaccination certificates were issued, don't touch, it's correct
    //   - only types of certificates issued in samoa were those, so just match presence in table
    // - otherwise, fix as above
    console.log(`patients.date_of_birth...`);
    console.time('patients.date_of_birth');
    await store.sequelize.query(`
        UPDATE patients
        SET date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_FMT}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE date_of_birth_legacy IS NOT NULL
          AND date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_FMT}')
          AND id NOT IN (
            SELECT DISTINCT p.id FROM patients p JOIN certificate_notifications cn ON cn.patient_id = p.id
          );
      `);
    console.timeEnd('patients.date_of_birth');
    
    // Vaccines get special handling:
    // - when we've got an external record (printed certificates!):
    // - we want these to match
    // - not as important to fix dates such that they are objectively correct
    console.log(`administered_vaccines.date...`);
    console.time('administered_vaccines.date');
    await store.sequelize.query(`
        -- optimisation to avoid running this as a subquery over and over
        CREATE MATERIALIZED VIEW max_cn_for_av AS (
          SELECT av.id as av_id, max(cn.created_at) as max_cn
          FROM certificate_notifications cn
          JOIN patients p ON cn.patient_id = p.id
          JOIN encounters e ON e.patient_id = p.id
          JOIN administered_vaccines av ON av.encounter_id = e.id
          WHERE cn.type = 'icao.vacc' AND av.id IS NOT NULL
          GROUP BY av.id
        );
        CREATE INDEX max_cn_for_av_idx ON max_cn_for_av (av_id);

        WITH
        updated_encounters AS (
          UPDATE administered_vaccines
          SET date = TO_CHAR(date_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Apia', '${ISO9075_DATE_TIME_FMT}'),
            updated_at = CURRENT_TIMESTAMP(3)
          WHERE date_legacy IS NOT NULL
            AND date = TO_CHAR(date_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${ISO9075_DATE_TIME_FMT}')
            AND created_at <= (SELECT max_cn FROM max_cn_for_av WHERE av_id = administered_vaccines.id)
          RETURNING encounter_id
        )
        UPDATE encounters SET updated_at = CURRENT_TIMESTAMP(3) WHERE id IN (select distinct encounter_id FROM updated_encounters);
        -- for sync, just in case these encounters weren't already hit by their own fix migration

        DROP INDEX max_cn_for_av_idx;
        DROP MATERIALIZED VIEW max_cn_for_av;
      `);
    console.timeEnd('administered_vaccines.date');
  });
  console.timeEnd('script');
}
