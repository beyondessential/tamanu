/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.sequelize.query(`
  CREATE OR REPLACE VIEW upcoming_vaccinations
AS WITH patient_scheduled_vaccines AS (
         SELECT p.id AS patient_id,
            sv.id AS scheduled_vaccine_id,
            sv.vaccine_id,
                CASE
                    WHEN sv.weeks_from_birth_due IS NULL THEN NULL::timestamp without time zone
                    ELSE p.date_of_birth::date + concat(sv.weeks_from_birth_due, ' week')::interval
                END AS vaccine_due,
            sv.weeks_from_last_vaccination_due
           FROM patients p
             CROSS JOIN scheduled_vaccines sv
          WHERE p.deleted_at IS NULL AND p.visibility_status::text = 'current'::text AND sv.deleted_at IS NULL AND sv.visibility_status = 'current'::text AND (sv.weeks_from_birth_due IS NOT NULL OR sv.weeks_from_last_vaccination_due IS NOT NULL)
        ), patient_administered_vaccines AS (
         SELECT e.patient_id,
            av.scheduled_vaccine_id,
            av.date AS administered_date
           FROM administered_vaccines av
             JOIN encounters e ON e.deleted_at IS NULL AND e.id::text = av.encounter_id::text
          WHERE av.deleted_at IS NULL AND av.status::text = 'GIVEN'::text
        ), patient_last_administered_vaccines AS (
         SELECT pav.patient_id,
            psv.vaccine_id,
            max(pav.administered_date::bpchar) AS last_administered_date
           FROM patient_administered_vaccines pav
             JOIN patient_scheduled_vaccines psv ON pav.patient_id::text = psv.patient_id::text AND pav.scheduled_vaccine_id::text = psv.scheduled_vaccine_id::text
          GROUP BY pav.patient_id, psv.vaccine_id
        ), patient_next_vaccine_details AS (
         SELECT psv.patient_id,
            psv.scheduled_vaccine_id,
            psv.vaccine_id,
            psv.vaccine_due,
                CASE
                    WHEN psv.vaccine_due IS NOT NULL THEN psv.vaccine_due
                    ELSE plav.last_administered_date::date + concat(psv.weeks_from_last_vaccination_due, ' week')::interval
                END AS next_due,
            rank(*) OVER (PARTITION BY psv.patient_id, psv.vaccine_id, pav.scheduled_vaccine_id ORDER BY psv.vaccine_due) = 1 AS is_next
           FROM patient_scheduled_vaccines psv
             LEFT JOIN patient_administered_vaccines pav ON pav.patient_id::text = psv.patient_id::text AND pav.scheduled_vaccine_id::text = psv.scheduled_vaccine_id::text
             LEFT JOIN patient_last_administered_vaccines plav ON plav.patient_id::text = psv.patient_id::text AND plav.vaccine_id::text = psv.vaccine_id::text
          WHERE pav.scheduled_vaccine_id IS NULL
        ), patient_next_vaccines AS (
         SELECT pnvd.patient_id,
            pnvd.scheduled_vaccine_id,
            pnvd.vaccine_id,
            EXTRACT(day FROM GREATEST(pnvd.vaccine_due, pnvd.next_due)::timestamp with time zone - now()) AS due_date
           FROM patient_next_vaccine_details pnvd
          WHERE pnvd.is_next = true
        ), vaccine_status_thresholds AS (
         SELECT (jsonb_array_elements(s.value) ->> 'threshold'::text)::double precision AS threshold,
            jsonb_array_elements(s.value) ->> 'status'::text AS status
           FROM settings s
          WHERE s.key = 'vaccine.thresholds'::text
        )
 SELECT patient_id,
    scheduled_vaccine_id,
    vaccine_id,
    due_date,
    ( SELECT vst.status
           FROM vaccine_status_thresholds vst
          WHERE vst.threshold < pnx.due_date::double precision
          ORDER BY vst.threshold DESC
         LIMIT 1) AS status
   FROM patient_next_vaccines pnx
  ORDER BY due_date;
  `);
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query(`DROP VIEW public.upcoming_vaccinations;`);
}
