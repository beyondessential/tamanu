import { QueryInterface } from 'sequelize';

// Must stay a single STABLE SQL statement so the planner inlines it: a call for one patient then
// reads only that patient's records.
const CREATE_FUNCTION = `
CREATE FUNCTION public.upcoming_vaccinations_for_patients(patient_ids varchar[])
RETURNS TABLE (
    patient_id varchar,
    scheduled_vaccine_id varchar,
    vaccine_category varchar,
    vaccine_id varchar,
    due_date date,
    days_till_due integer,
    status text
)
LANGUAGE sql STABLE PARALLEL SAFE AS $$
WITH vaccine_settings AS MATERIALIZED (
    SELECT s.value AS thresholds, 1 AS priority
      FROM public.settings s
     WHERE s.deleted_at IS NULL
       AND s.key = 'upcomingVaccinations.thresholds'::text
     UNION
    SELECT '[{"status": "SCHEDULED", "threshold": 28}, {"status": "UPCOMING", "threshold": 7}, {"status": "DUE", "threshold": -7}, {"status": "OVERDUE", "threshold": -55}, {"status": "MISSED", "threshold": "-Infinity"}]'::jsonb,
           0
     ORDER BY 2 DESC
     LIMIT 1
),
vaccine_thresholds AS MATERIALIZED (
    SELECT ((jsonb_array_elements(s.thresholds) ->> 'threshold'::text))::double precision AS threshold,
           (jsonb_array_elements(s.thresholds) ->> 'status'::text) AS status
      FROM vaccine_settings s
),
vaccine_agelimit_settings AS MATERIALIZED (
    SELECT s.value AS age_limit, 1 AS priority
      FROM public.settings s
     WHERE s.deleted_at IS NULL
       AND s.key = 'upcomingVaccinations.ageLimit'::text
     UNION
    SELECT '15'::jsonb, 0
     ORDER BY 2 DESC
     LIMIT 1
),
filtered_patients AS MATERIALIZED (
    SELECT p.id AS patient_id,
           (p.date_of_birth)::date AS date_of_birth
      FROM public.patients p
     WHERE p.deleted_at IS NULL
       AND (p.visibility_status)::text = 'current'::text
       AND (patient_ids IS NULL OR p.id = ANY (patient_ids))
       AND (p.date_of_birth)::date > (
             SELECT CURRENT_DATE - ((s.age_limit)::text)::integer * 365 FROM vaccine_agelimit_settings s)
),
filtered_scheduled_vaccines AS MATERIALIZED (
    SELECT sv.id AS scheduled_vaccine_id,
           sv.category AS vaccine_category,
           sv.vaccine_id,
           sv.index,
           sv.weeks_from_birth_due,
           sv.weeks_from_last_vaccination_due
      FROM public.scheduled_vaccines sv
     WHERE sv.deleted_at IS NULL
       AND sv.visibility_status = 'current'::text
),
fixed_candidates AS MATERIALIZED (
    SELECT fp.patient_id,
           fsv.scheduled_vaccine_id,
           fsv.vaccine_category,
           fsv.vaccine_id,
           fp.date_of_birth + fsv.weeks_from_birth_due * 7 AS due_date
      FROM filtered_scheduled_vaccines fsv
      JOIN filtered_patients fp
        ON fp.date_of_birth >= CURRENT_DATE - 180 - fsv.weeks_from_birth_due * 7
       AND fp.date_of_birth <= CURRENT_DATE + 730 - fsv.weeks_from_birth_due * 7
     WHERE fsv.weeks_from_birth_due IS NOT NULL
       AND fsv.weeks_from_last_vaccination_due IS NULL
),
dose_interval_series AS MATERIALIZED (
    SELECT sv.*
      FROM filtered_scheduled_vaccines sv
     WHERE EXISTS (
             SELECT 1 FROM filtered_scheduled_vaccines d
              WHERE d.vaccine_id = sv.vaccine_id
                AND d.vaccine_category = sv.vaccine_category
                AND d.weeks_from_birth_due IS NULL
                AND d.weeks_from_last_vaccination_due IS NOT NULL)
),
given AS MATERIALIZED (
    SELECT e.patient_id,
           av.scheduled_vaccine_id,
           (av.date)::date AS administered_date
      FROM public.administered_vaccines av
      JOIN public.encounters e ON e.id = av.encounter_id
     WHERE av.deleted_at IS NULL
       AND av.status = 'GIVEN'::text
       AND e.deleted_at IS NULL
       AND EXISTS (
             SELECT 1 FROM public.patients p
              WHERE p.id = e.patient_id
                AND (patient_ids IS NULL OR p.id = ANY (patient_ids))
                AND p.deleted_at IS NULL
                AND (p.visibility_status)::text = 'current'::text
                AND (p.date_of_birth)::date > (
                      SELECT CURRENT_DATE - ((s.age_limit)::text)::integer * 365 FROM vaccine_agelimit_settings s))
       AND EXISTS (
             SELECT 1 FROM public.scheduled_vaccines sv
              WHERE sv.id = av.scheduled_vaccine_id
                AND sv.deleted_at IS NULL
                AND sv.visibility_status = 'current'::text)
),
patient_vaccine_fixed_schedule AS (
    SELECT fc.*
      FROM fixed_candidates fc
     WHERE NOT EXISTS (
             SELECT 1 FROM given g
              WHERE g.patient_id = fc.patient_id
                AND g.scheduled_vaccine_id = fc.scheduled_vaccine_id)
),
latest_administered_vaccines AS (
    SELECT DISTINCT ON (g.patient_id, s.vaccine_category, s.vaccine_id)
           g.patient_id, g.administered_date, s.vaccine_category, s.vaccine_id, s.index
      FROM given g
      JOIN dose_interval_series s ON s.scheduled_vaccine_id = g.scheduled_vaccine_id
     ORDER BY g.patient_id, s.vaccine_category, s.vaccine_id, s.index DESC
),
patient_vaccine_dynamic_schedule AS (
    SELECT DISTINCT ON (lav.patient_id, upcoming_sv.vaccine_category, upcoming_sv.vaccine_id)
           lav.patient_id,
           upcoming_sv.scheduled_vaccine_id,
           upcoming_sv.vaccine_category,
           upcoming_sv.vaccine_id,
           ((upcoming_sv.weeks_from_last_vaccination_due * 7) + lav.administered_date) AS due_date
      FROM latest_administered_vaccines lav
      JOIN dose_interval_series upcoming_sv
             ON upcoming_sv.vaccine_id = lav.vaccine_id
            AND upcoming_sv.vaccine_category = lav.vaccine_category
            AND upcoming_sv.weeks_from_birth_due IS NULL
            AND upcoming_sv.weeks_from_last_vaccination_due IS NOT NULL
            AND upcoming_sv.index > lav.index
     WHERE NOT EXISTS (
             SELECT 1 FROM given g
              WHERE g.patient_id = lav.patient_id
                AND g.scheduled_vaccine_id = upcoming_sv.scheduled_vaccine_id)
     ORDER BY lav.patient_id, upcoming_sv.vaccine_category, upcoming_sv.vaccine_id, upcoming_sv.index
),
patient_vaccine_schedule AS (
    SELECT patient_id, scheduled_vaccine_id, vaccine_category, vaccine_id, due_date
      FROM patient_vaccine_fixed_schedule
     UNION ALL
    SELECT patient_id, scheduled_vaccine_id, vaccine_category, vaccine_id, due_date
      FROM patient_vaccine_dynamic_schedule
     WHERE due_date >= (CURRENT_DATE - 180)
       AND due_date <= (CURRENT_DATE + 730)
)
SELECT pvs.patient_id,
       pvs.scheduled_vaccine_id,
       pvs.vaccine_category,
       pvs.vaccine_id,
       pvs.due_date,
       (pvs.due_date - CURRENT_DATE) AS days_till_due,
       (SELECT vst.status
          FROM vaccine_thresholds vst
         WHERE ((pvs.due_date - CURRENT_DATE))::double precision > vst.threshold
         ORDER BY vst.threshold DESC
         LIMIT 1) AS status
  FROM patient_vaccine_schedule pvs
$$;
`;

const UPCOMING_VACCINATIONS_VIEW = `
CREATE OR REPLACE VIEW public.upcoming_vaccinations AS
SELECT patient_id::varchar(255) AS patient_id,
       scheduled_vaccine_id::varchar(255) AS scheduled_vaccine_id,
       vaccine_category::varchar(255) AS vaccine_category,
       vaccine_id::varchar(255) AS vaccine_id,
       due_date,
       days_till_due,
       status
  FROM public.upcoming_vaccinations_for_patients(NULL);
`;

const PREVIOUS_UPCOMING_VACCINATIONS_VIEW = `
CREATE OR REPLACE VIEW public.upcoming_vaccinations AS
WITH vaccine_settings AS MATERIALIZED (
    SELECT s.value AS thresholds, 1 AS priority
      FROM public.settings s
     WHERE s.deleted_at IS NULL
       AND s.key = 'upcomingVaccinations.thresholds'::text
     UNION
    SELECT '[{"status": "SCHEDULED", "threshold": 28}, {"status": "UPCOMING", "threshold": 7}, {"status": "DUE", "threshold": -7}, {"status": "OVERDUE", "threshold": -55}, {"status": "MISSED", "threshold": "-Infinity"}]'::jsonb,
           0
     ORDER BY 2 DESC
     LIMIT 1
),
vaccine_thresholds AS MATERIALIZED (
    SELECT ((jsonb_array_elements(s.thresholds) ->> 'threshold'::text))::double precision AS threshold,
           (jsonb_array_elements(s.thresholds) ->> 'status'::text) AS status
      FROM vaccine_settings s
),
vaccine_agelimit_settings AS MATERIALIZED (
    SELECT s.value AS age_limit, 1 AS priority
      FROM public.settings s
     WHERE s.deleted_at IS NULL
       AND s.key = 'upcomingVaccinations.ageLimit'::text
     UNION
    SELECT '15'::jsonb, 0
     ORDER BY 2 DESC
     LIMIT 1
),
vaccine_agelimit AS MATERIALIZED (
    SELECT (CURRENT_DATE - (((s.age_limit)::text)::integer * 365)) AS date
      FROM vaccine_agelimit_settings s
),
filtered_patients AS MATERIALIZED (
    SELECT p.id AS patient_id,
           (p.date_of_birth)::date AS date_of_birth
      FROM public.patients p
     WHERE p.deleted_at IS NULL
       AND (p.visibility_status)::text = 'current'::text
       AND (p.date_of_birth)::date > (SELECT date FROM vaccine_agelimit)
),
filtered_scheduled_vaccines AS MATERIALIZED (
    SELECT sv.id AS scheduled_vaccine_id,
           sv.category AS vaccine_category,
           sv.vaccine_id,
           sv.index,
           sv.weeks_from_birth_due,
           sv.weeks_from_last_vaccination_due
      FROM public.scheduled_vaccines sv
     WHERE sv.deleted_at IS NULL
       AND sv.visibility_status = 'current'::text
),
base_administered_vaccines AS MATERIALIZED (
    SELECT e.patient_id,
           av.scheduled_vaccine_id,
           (av.date)::date AS administered_date,
           sv.vaccine_category,
           sv.vaccine_id,
           sv.index
      FROM public.administered_vaccines av
      JOIN filtered_scheduled_vaccines sv ON sv.scheduled_vaccine_id = av.scheduled_vaccine_id
      JOIN public.encounters e ON e.id = av.encounter_id
     WHERE av.deleted_at IS NULL
       AND av.status = 'GIVEN'::text
       AND e.deleted_at IS NULL
       AND e.patient_id IN (SELECT patient_id FROM filtered_patients)
),
latest_administered_vaccines AS (
    SELECT DISTINCT ON (patient_id, vaccine_category, vaccine_id)
           patient_id,
           scheduled_vaccine_id,
           administered_date,
           vaccine_category,
           vaccine_id,
           index
      FROM base_administered_vaccines
     ORDER BY patient_id, vaccine_category, vaccine_id, index DESC
),
patient_vaccine_fixed_schedule AS (
    SELECT fp.patient_id,
           fsv.scheduled_vaccine_id,
           fsv.vaccine_category,
           fsv.vaccine_id,
           (fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) AS due_date
      FROM filtered_patients fp
     CROSS JOIN filtered_scheduled_vaccines fsv
      LEFT JOIN base_administered_vaccines fav
             ON fav.patient_id = fp.patient_id
            AND fav.scheduled_vaccine_id = fsv.scheduled_vaccine_id
     WHERE fav.scheduled_vaccine_id IS NULL
       AND fsv.weeks_from_birth_due IS NOT NULL
       AND fsv.weeks_from_last_vaccination_due IS NULL
       AND (fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) >= (CURRENT_DATE - 180)
       AND (fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) <= (CURRENT_DATE + 730)
),
patient_vaccine_dynamic_schedule AS (
    SELECT DISTINCT ON (fp.patient_id, upcoming_sv.vaccine_category, upcoming_sv.vaccine_id)
           fp.patient_id,
           upcoming_sv.scheduled_vaccine_id,
           upcoming_sv.vaccine_category,
           upcoming_sv.vaccine_id,
           ((upcoming_sv.weeks_from_last_vaccination_due * 7) + fav.administered_date) AS due_date
      FROM latest_administered_vaccines fav
      JOIN filtered_patients fp ON fp.patient_id = fav.patient_id
      JOIN filtered_scheduled_vaccines latest_sv
             ON latest_sv.scheduled_vaccine_id = fav.scheduled_vaccine_id
      JOIN filtered_scheduled_vaccines upcoming_sv
             ON upcoming_sv.vaccine_id = latest_sv.vaccine_id
            AND upcoming_sv.vaccine_category = latest_sv.vaccine_category
            AND upcoming_sv.weeks_from_birth_due IS NULL
            AND upcoming_sv.weeks_from_last_vaccination_due IS NOT NULL
            AND upcoming_sv.index > latest_sv.index
      LEFT JOIN base_administered_vaccines upcoming_av
             ON upcoming_av.patient_id = fp.patient_id
            AND upcoming_av.scheduled_vaccine_id = upcoming_sv.scheduled_vaccine_id
     WHERE upcoming_av.scheduled_vaccine_id IS NULL
     ORDER BY fp.patient_id, upcoming_sv.vaccine_category, upcoming_sv.vaccine_id, upcoming_sv.index
),
patient_vaccine_schedule AS (
    SELECT patient_id, scheduled_vaccine_id, vaccine_category, vaccine_id, due_date
      FROM patient_vaccine_fixed_schedule
     UNION ALL
    SELECT patient_id, scheduled_vaccine_id, vaccine_category, vaccine_id, due_date
      FROM patient_vaccine_dynamic_schedule
     WHERE due_date >= (CURRENT_DATE - 180)
       AND due_date <= (CURRENT_DATE + 730)
)
SELECT pvs.patient_id,
       pvs.scheduled_vaccine_id,
       pvs.vaccine_category,
       pvs.vaccine_id,
       pvs.due_date,
       (pvs.due_date - CURRENT_DATE) AS days_till_due,
       (SELECT vst.status
          FROM vaccine_thresholds vst
         WHERE ((pvs.due_date - CURRENT_DATE))::double precision > vst.threshold
         ORDER BY vst.threshold DESC
         LIMIT 1) AS status
  FROM patient_vaccine_schedule pvs;
`;

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(CREATE_FUNCTION);
  await query.sequelize.query(UPCOMING_VACCINATIONS_VIEW);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(PREVIOUS_UPCOMING_VACCINATIONS_VIEW);
  await query.sequelize.query(
    `DROP FUNCTION public.upcoming_vaccinations_for_patients(varchar[]);`,
  );
}
