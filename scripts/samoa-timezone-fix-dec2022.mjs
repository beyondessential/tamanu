// Run inside sync-server shell by:
// > tzfix = await import('../../scripts/samoa-timezone-fix-dec2022.mjs');
// > await tzfix.run(store);

const FORMATS = {
  time: 'YYYY-MM-DD HH24:MI:SS',
  date: 'YYYY-MM-DD',
};

const mapTable = table =>
  Object.entries(table).flatMap(([t, { type, also, cols }]) =>
    cols.map(col => [t, { type, also, col }]),
  );

const tableColumns = mapTable({
  appointments: { type: 'date', also: 'patient', cols: ['start_time', 'end_time'] },
  encounter_diagnoses: { type: 'time', also: 'encounter', cols: ['date'] },
  encounter_medications: { type: 'time', also: 'encounter', cols: ['date', 'end_date'] },
  encounters: { type: 'time', also: 'patient', cols: ['start_date', 'end_date'] },
  imaging_requests: { type: 'time', also: 'encounter', cols: ['requested_date'] },
  invoice_line_items: { type: 'time', also: 'invoice', cols: ['date_generated'] },
  invoice_price_change_items: { type: 'time', also: 'invoice', cols: ['date'] },
  invoices: { type: 'time', also: 'encounter', cols: ['date'] },
  lab_requests: { type: 'date', also: 'encounter', cols: ['sample_time', 'requested_date'] },
  note_items: { type: 'time', also: 'note_page', cols: ['date'] },
  note_pages: { type: 'time', also: null, cols: ['date'] },
  patient_allergies: { type: 'time', also: 'patient', cols: ['recorded_date'] },
  patient_care_plans: { type: 'time', also: 'patient', cols: ['date'] },
  patient_conditions: { type: 'time', also: 'patient', cols: ['recorded_date'] },
  patient_death_data: {
    type: 'time',
    also: 'patient',
    cols: ['external_cause_date', 'last_surgery_date'],
  },
  patient_family_histories: { type: 'time', also: 'patient', cols: ['recorded_date'] },
  patient_issues: { type: 'time', also: 'patient', cols: ['recorded_date'] },
  patients: { type: 'date', also: null, cols: ['date_of_death'] },
  procedures: { type: 'time', also: 'encounter', cols: ['date', 'start_time', 'end_time'] },
  triages: {
    type: 'date',
    also: 'encounter',
    cols: ['arrival_time', 'triage_time', 'closed_time'],
  },
  vitals: { type: 'time', also: 'encounter', cols: ['date_recorded'] },
});

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
    console.time('normal fixes');
    for (const [tableName, { type, also, col: columnName }] of tableColumns) {
      const logname = `${tableName}.${columnName} (${type}) +${also ?? 'none'}`;
      console.log(`${logname}: start`);
      console.time(logname);
      await store.sequelize.query(`
        ${also ? 'WITH updated_rows AS (' : ''}
          UPDATE ${tableName}
          SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${FORMATS[type]}'),
            updated_at = CURRENT_TIMESTAMP(3)
          WHERE ${columnName}_legacy IS NOT NULL
            AND ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${FORMATS[type]}')
        ${also ? `
          RETURNING ${also}_id AS also_id
        )
        UPDATE ${also}s
        SET updated_at = CURRENT_TIMESTAMP(3)
        WHERE id IN (select distinct also_id FROM updated_rows)
        ` : ''}
      `);
      console.timeEnd(logname);
    }
    console.timeEnd('normal fixes');

    // DOB gets special handling:
    // - if any test or vaccination certificates were issued, don't touch, it's correct
    //   - only types of certificates issued in samoa were those, so just match presence in table
    // - otherwise, fix as normal
    console.log(`patients.date_of_birth (date) +none: start`);
    console.time('patients.date_of_birth (date) +none: start');
    await store.sequelize.query(`
        UPDATE patients
        SET date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', '${FORMATS.date}'),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE date_of_birth_legacy IS NOT NULL
          AND date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${FORMATS.date}')
          AND id NOT IN (
            SELECT DISTINCT p.id FROM patients p JOIN certificate_notifications cn ON cn.patient_id = p.id
          );
      `);
    console.timeEnd('patients.date_of_birth (date) +none: start');

    // Vaccines get special handling:
    // - when we've got an external record (printed certificates!):
    // - we want these to match
    // - not as important to fix dates such that they are objectively correct
    console.log(`administered_vaccines.date (time) +encounter: start`);
    console.time('administered_vaccines.date (time) +encounter: start');
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
          SET date = TO_CHAR(date_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Apia', '${FORMATS.time}'),
            updated_at = CURRENT_TIMESTAMP(3)
          WHERE date_legacy IS NOT NULL
            AND date = TO_CHAR(date_legacy::TIMESTAMPTZ AT TIME ZONE 'Pacific/Samoa', '${FORMATS.time}')
            AND created_at <= (SELECT max_cn FROM max_cn_for_av WHERE av_id = administered_vaccines.id)
          RETURNING encounter_id
        )
        UPDATE encounters SET updated_at = CURRENT_TIMESTAMP(3) WHERE id IN (select distinct encounter_id FROM updated_encounters);
        -- for sync, just in case these encounters weren't already hit by their own fix migration

        DROP INDEX max_cn_for_av_idx;
        DROP MATERIALIZED VIEW max_cn_for_av;
      `);
    console.timeEnd('administered_vaccines.date (time) +encounter: start');
  });
  console.timeEnd('script');
}
