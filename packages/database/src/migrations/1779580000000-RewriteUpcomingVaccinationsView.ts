import { QueryInterface } from 'sequelize';

const NEW_UPCOMING_VACCINATIONS_VIEW = `
CREATE VIEW public.upcoming_vaccinations AS
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

const OLD_UPCOMING_VACCINATIONS_VIEW = `
CREATE VIEW public.upcoming_vaccinations AS
 WITH vaccine_settings AS (
         SELECT s.value AS thresholds,
            1 AS priority
           FROM public.settings s
          WHERE ((s.deleted_at IS NULL) AND (s.key = 'upcomingVaccinations.thresholds'::text))
        UNION
         SELECT '[{"status": "SCHEDULED", "threshold": 28}, {"status": "UPCOMING", "threshold": 7}, {"status": "DUE", "threshold": -7}, {"status": "OVERDUE", "threshold": -55}, {"status": "MISSED", "threshold": "-Infinity"}]'::jsonb AS jsonb,
            0
  ORDER BY 2 DESC
 LIMIT 1
        ), vaccine_thresholds AS (
         SELECT ((jsonb_array_elements(s.thresholds) ->> 'threshold'::text))::double precision AS threshold,
            (jsonb_array_elements(s.thresholds) ->> 'status'::text) AS status
           FROM vaccine_settings s
        ), vaccine_agelimit_settings AS (
         SELECT s.value AS age_limit,
            1 AS priority
           FROM public.settings s
          WHERE ((s.deleted_at IS NULL) AND (s.key = 'upcomingVaccinations.ageLimit'::text))
        UNION
         SELECT '15'::jsonb AS jsonb,
            0
  ORDER BY 2 DESC
 LIMIT 1
        ), vaccine_agelimit AS (
         SELECT (CURRENT_DATE - (((s.age_limit)::text)::integer * 365)) AS date
           FROM vaccine_agelimit_settings s
        ), filtered_patients AS (
         SELECT p.id AS patient_id,
            (p.date_of_birth)::date AS date_of_birth
           FROM public.patients p
          WHERE ((p.deleted_at IS NULL) AND ((p.visibility_status)::text = 'current'::text) AND ((p.date_of_birth)::date > ( SELECT vaccine_agelimit.date
                   FROM vaccine_agelimit)))
        ), filtered_scheduled_vaccines AS (
         SELECT sv.id AS scheduled_vaccine_id,
            sv.category AS vaccine_category,
            sv.vaccine_id,
            sv.index,
            sv.weeks_from_birth_due,
            sv.weeks_from_last_vaccination_due
           FROM public.scheduled_vaccines sv
          WHERE ((sv.deleted_at IS NULL) AND (sv.visibility_status = 'current'::text))
        ), filtered_administered_vaccines AS (
         SELECT e.patient_id,
            av.scheduled_vaccine_id,
            (av.date)::date AS administered_date
           FROM ((public.administered_vaccines av
             JOIN public.scheduled_vaccines sv ON (((sv.id)::text = (av.scheduled_vaccine_id)::text)))
             JOIN public.encounters e ON (((e.id)::text = (av.encounter_id)::text)))
          WHERE ((av.deleted_at IS NULL) AND ((av.status)::text = 'GIVEN'::text) AND (e.deleted_at IS NULL))
        ), latest_administered_vaccines AS (
         SELECT DISTINCT ON (e.patient_id, sv.vaccine_category, sv.vaccine_id) av.id,
            e.patient_id,
            av.scheduled_vaccine_id,
            (av.date)::date AS administered_date,
            sv.vaccine_category,
            sv.vaccine_id,
            sv.index
           FROM ((public.administered_vaccines av
             JOIN filtered_scheduled_vaccines sv ON (((sv.scheduled_vaccine_id)::text = (av.scheduled_vaccine_id)::text)))
             JOIN public.encounters e ON (((e.id)::text = (av.encounter_id)::text)))
          WHERE ((av.deleted_at IS NULL) AND ((av.status)::text = 'GIVEN'::text) AND (e.deleted_at IS NULL))
          ORDER BY e.patient_id, sv.vaccine_category, sv.vaccine_id, sv.index DESC
        ), patient_vaccine_fixed_schedule AS (
         SELECT fp.patient_id,
            fsv.scheduled_vaccine_id,
            fsv.vaccine_category,
            fsv.vaccine_id,
            (fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) AS due_date
           FROM ((filtered_patients fp
             CROSS JOIN filtered_scheduled_vaccines fsv)
             LEFT JOIN filtered_administered_vaccines fav ON ((((fav.patient_id)::text = (fp.patient_id)::text) AND ((fav.scheduled_vaccine_id)::text = (fsv.scheduled_vaccine_id)::text))))
          WHERE ((fav.scheduled_vaccine_id IS NULL) AND (fsv.weeks_from_birth_due IS NOT NULL) AND (fsv.weeks_from_last_vaccination_due IS NULL) AND (((fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) >= (CURRENT_DATE - 180)) AND ((fp.date_of_birth + (fsv.weeks_from_birth_due * 7)) <= (CURRENT_DATE + 730))))
        ), patient_vaccine_dynamic_schedule AS (
         SELECT DISTINCT ON (fp.patient_id, upcoming_scheduled_vaccine.vaccine_category, upcoming_scheduled_vaccine.vaccine_id) fp.patient_id,
            upcoming_scheduled_vaccine.scheduled_vaccine_id,
            upcoming_scheduled_vaccine.vaccine_category,
            upcoming_scheduled_vaccine.vaccine_id,
            ((upcoming_scheduled_vaccine.weeks_from_last_vaccination_due * 7) + fav.administered_date) AS due_date
           FROM ((((latest_administered_vaccines fav
             JOIN filtered_patients fp ON (((fp.patient_id)::text = (fav.patient_id)::text)))
             JOIN filtered_scheduled_vaccines latest_scheduled_vaccines ON (((latest_scheduled_vaccines.scheduled_vaccine_id)::text = (fav.scheduled_vaccine_id)::text)))
             JOIN filtered_scheduled_vaccines upcoming_scheduled_vaccine ON ((((latest_scheduled_vaccines.vaccine_id)::text = (upcoming_scheduled_vaccine.vaccine_id)::text) AND ((latest_scheduled_vaccines.vaccine_category)::text = (upcoming_scheduled_vaccine.vaccine_category)::text) AND (upcoming_scheduled_vaccine.weeks_from_birth_due IS NULL) AND (upcoming_scheduled_vaccine.weeks_from_last_vaccination_due IS NOT NULL) AND (upcoming_scheduled_vaccine.index > latest_scheduled_vaccines.index))))
             LEFT JOIN filtered_administered_vaccines upcoming_administered_vaccines ON ((((upcoming_administered_vaccines.patient_id)::text = (fp.patient_id)::text) AND ((upcoming_administered_vaccines.scheduled_vaccine_id)::text = (upcoming_scheduled_vaccine.scheduled_vaccine_id)::text))))
          WHERE (upcoming_administered_vaccines.scheduled_vaccine_id IS NULL)
          ORDER BY fp.patient_id, upcoming_scheduled_vaccine.vaccine_category, upcoming_scheduled_vaccine.vaccine_id, upcoming_scheduled_vaccine.index
        ), patient_vaccine_schedule AS (
         SELECT patient_vaccine_fixed_schedule.patient_id,
            patient_vaccine_fixed_schedule.scheduled_vaccine_id,
            patient_vaccine_fixed_schedule.vaccine_category,
            patient_vaccine_fixed_schedule.vaccine_id,
            patient_vaccine_fixed_schedule.due_date
           FROM patient_vaccine_fixed_schedule
        UNION ALL
         SELECT patient_vaccine_dynamic_schedule.patient_id,
            patient_vaccine_dynamic_schedule.scheduled_vaccine_id,
            patient_vaccine_dynamic_schedule.vaccine_category,
            patient_vaccine_dynamic_schedule.vaccine_id,
            patient_vaccine_dynamic_schedule.due_date
           FROM patient_vaccine_dynamic_schedule
          WHERE ((patient_vaccine_dynamic_schedule.due_date >= (CURRENT_DATE - 180)) AND (patient_vaccine_dynamic_schedule.due_date <= (CURRENT_DATE + 730)))
        )
 SELECT pvs.patient_id,
    pvs.scheduled_vaccine_id,
    pvs.vaccine_category,
    pvs.vaccine_id,
    pvs.due_date,
    (pvs.due_date - CURRENT_DATE) AS days_till_due,
    ( SELECT vst.status
           FROM vaccine_thresholds vst
          WHERE (((pvs.due_date - CURRENT_DATE))::double precision > vst.threshold)
          ORDER BY vst.threshold DESC
         LIMIT 1) AS status
   FROM patient_vaccine_schedule pvs;
`;

const RECREATE_MATERIALIZED_VIEW = `
  CREATE MATERIALIZED VIEW public.materialized_upcoming_vaccinations AS
   SELECT upcoming_vaccinations.patient_id,
          upcoming_vaccinations.scheduled_vaccine_id,
          upcoming_vaccinations.vaccine_category,
          upcoming_vaccinations.vaccine_id,
          upcoming_vaccinations.due_date,
          upcoming_vaccinations.days_till_due,
          upcoming_vaccinations.status
     FROM public.upcoming_vaccinations
    WITH NO DATA;
`;

const RECREATE_UNIQUE_INDEX = `
  CREATE UNIQUE INDEX materialized_upcoming_vaccinations_unique_index
    ON public.materialized_upcoming_vaccinations
 USING btree (patient_id, scheduled_vaccine_id);
`;

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP MATERIALIZED VIEW public.materialized_upcoming_vaccinations;`);
  await query.sequelize.query(`DROP VIEW public.upcoming_vaccinations;`);
  await query.sequelize.query(NEW_UPCOMING_VACCINATIONS_VIEW);
  await query.sequelize.query(RECREATE_MATERIALIZED_VIEW);
  await query.sequelize.query(RECREATE_UNIQUE_INDEX);
  await query.sequelize.query(`REFRESH MATERIALIZED VIEW public.materialized_upcoming_vaccinations;`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP MATERIALIZED VIEW public.materialized_upcoming_vaccinations;`);
  await query.sequelize.query(`DROP VIEW public.upcoming_vaccinations;`);
  await query.sequelize.query(OLD_UPCOMING_VACCINATIONS_VIEW);
  await query.sequelize.query(RECREATE_MATERIALIZED_VIEW);
  await query.sequelize.query(RECREATE_UNIQUE_INDEX);
  await query.sequelize.query(`REFRESH MATERIALIZED VIEW public.materialized_upcoming_vaccinations;`);
}
