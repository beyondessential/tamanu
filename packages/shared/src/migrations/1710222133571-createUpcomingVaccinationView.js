/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.sequelize.query(`
WITH
vaccine_thresholds AS (
	SELECT
		(jsonb_array_elements(s.value) ->> 'threshold'::text)::double precision AS threshold,
		jsonb_array_elements(s.value) ->> 'status'::text AS status
	FROM settings s
	WHERE s.deleted_at is null
	and s.key = 'routineVaccine.thresholds'::text
),
vaccine_agelimit as (
	select
		s.value::text::integer age
	from settings s
	where s.deleted_at is null
	and s.key = 'routineVaccine.ageLimit'
),
patient_filtered as (
	select
		 p.id patient_id,
		 p.date_of_birth::date
	from patients p
	where p.deleted_at is null
	and p.visibility_status = 'current'
	and extract(year from AGE(now(), p.date_of_birth::date)) <= (select "age" from vaccine_agelimit)
),
scheduled_vaccine_filtered as (
	select
		sv.id scheduled_vaccine_id,
		sv.vaccine_id,
		sv.index dose_order,
		sv.weeks_from_birth_due,
		sv.weeks_from_last_vaccination_due
	from scheduled_vaccines sv
	where sv.deleted_at is null
	and sv.visibility_status = 'current'
	and sv.category = 'Routine'
	and (sv.weeks_from_birth_due is not null or sv.weeks_from_last_vaccination_due is not null)
),
patient_scheduled_vaccines as (
	select
		pf.patient_id,
		svf.scheduled_vaccine_id,
		svf.vaccine_id,
		svf.dose_order,
		case
			when svf.weeks_from_birth_due is null then null
			else (pf.date_of_birth + concat(svf.weeks_from_birth_due, ' week')::interval)::date
		end vaccine_due,
		svf.weeks_from_last_vaccination_due
	from patient_filtered pf
	cross join scheduled_vaccine_filtered svf
),
patient_administered_vaccines AS (
    SELECT
    	e.patient_id,
		av.scheduled_vaccine_id,
		av.date::date AS administered_date
	FROM administered_vaccines av
	JOIN encounters e
		ON e.deleted_at IS NULL
		AND e.id = av.encounter_id
		and e.patient_id in (select patient_id from patient_filtered)
		and e.encounter_type = 'vaccination'
	WHERE av.deleted_at IS NULL
	AND av.status = 'GIVEN'
),
patient_last_administered_vaccines AS (
    SELECT
    	pav.patient_id,
		psv.vaccine_id,
		max(pav.administered_date) AS last_administered_date
	FROM patient_administered_vaccines pav
	JOIN patient_scheduled_vaccines psv
		ON pav.patient_id = psv.patient_id
		AND pav.scheduled_vaccine_id = psv.scheduled_vaccine_id
	GROUP BY pav.patient_id, psv.vaccine_id
),
patient_next_vaccine_details AS (
    SELECT
    	psv.patient_id,
		psv.scheduled_vaccine_id,
		psv.vaccine_id,
		psv.dose_order,
		CASE
			WHEN psv.vaccine_due IS NOT NULL THEN psv.vaccine_due
			ELSE (plav.last_administered_date + concat(psv.weeks_from_last_vaccination_due, ' week')::interval)::date
		END AS due_date,
       rank(*) OVER (PARTITION BY psv.patient_id, psv.vaccine_id, pav.scheduled_vaccine_id ORDER BY psv.dose_order) = 1 AS is_next
      FROM patient_scheduled_vaccines psv
        LEFT JOIN patient_administered_vaccines pav
        	ON pav.patient_id = psv.patient_id
    		AND pav.scheduled_vaccine_id = psv.scheduled_vaccine_id
        LEFT JOIN patient_last_administered_vaccines plav
        	ON plav.patient_id = psv.patient_id
    		AND plav.vaccine_id = psv.vaccine_id
     WHERE pav.scheduled_vaccine_id IS NULL
),
patient_next_vaccines AS (
    SELECT
    	pnvd.patient_id,
    	pnvd.scheduled_vaccine_id,
    	pnvd.vaccine_id,
    	pnvd.dose_order,
    	pnvd.due_date,
    	extract(day from (pnvd.due_date - now())) days_till_due
      FROM patient_next_vaccine_details pnvd
     WHERE pnvd.is_next = true
)
SELECT
	*,
	(SELECT vst.status
	FROM vaccine_thresholds vst
	WHERE pnx.days_till_due > vst.threshold
	ORDER BY vst.threshold DESC
	LIMIT 1) AS status
FROM patient_next_vaccines pnx;
  `);
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query(`DROP VIEW upcoming_vaccinations;`);
}
