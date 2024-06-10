/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.sequelize.query(
    `
  create or replace view upcoming_vaccinations
  as
  with vaccine_settings as (
    select s.value as thresholds, 1 as priority
    from settings s
    where s.deleted_at is null
    and s.key = 'upcomingVaccinations.thresholds'::text
    union
    select :thresholdsDefault, 0
    order by priority desc limit 1
  ),
  vaccine_thresholds as (
	  select
		  (jsonb_array_elements(s.thresholds) ->> 'threshold'::text)::double precision AS threshold,
		  jsonb_array_elements(s.thresholds) ->> 'status'::text AS status
	  from vaccine_settings s
  ),
  vaccine_agelimit_settings as (
    select s.value as age_limit, 1 as priority
    from settings s
    where s.deleted_at is null
    and s.key = 'upcomingVaccinations.ageLimit'::text
    union
    select :ageLimitDefault, 0
    order by priority desc limit 1
  ),
  vaccine_agelimit as (
	  select
		  CURRENT_DATE - s.age_limit::text::integer * 365 date
    from vaccine_agelimit_settings s
  ),
  filtered_patients as (
	  select p.id patient_id, p.date_of_birth::date
    from patients p where p.deleted_at is null and p.visibility_status = 'current' and p.date_of_birth::date > (select "date" from vaccine_agelimit)
  ),
  filtered_scheduled_vaccines as (
	  select sv.id scheduled_vaccine_id, sv.category vaccine_category, sv.vaccine_id, sv.index, sv.weeks_from_birth_due, sv.weeks_from_last_vaccination_due from scheduled_vaccines sv
	  where sv.deleted_at is null and sv.visibility_status = 'current'
  ),
  filtered_administered_vaccines as (
	  select
      e.patient_id,
      av.scheduled_vaccine_id,
      av."date"::date administered_date
    from administered_vaccines av
    join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id
	  join encounters e on e.id = av.encounter_id
	  where av.deleted_at is null and av.status = 'GIVEN'
	  and e.deleted_at is null
  ),
  patient_vaccine_fixed_schedule as (
  select
	  --distinct on (fp.patient_id, fsv.vaccine_category, fsv.vaccine_id)
	  fp.patient_id,
	  fsv.scheduled_vaccine_id,
	  fsv.vaccine_category,
	  fsv.vaccine_id,
	  fp.date_of_birth + fsv.weeks_from_birth_due * 7 due_date
  from filtered_patients fp
  cross join filtered_scheduled_vaccines fsv
  left join filtered_administered_vaccines fav on fav.patient_id = fp.patient_id and fav.scheduled_vaccine_id = fsv.scheduled_vaccine_id
  where fav.scheduled_vaccine_id is null
  and fsv.weeks_from_birth_due is not null and fsv.weeks_from_last_vaccination_due is null
  and (fp.date_of_birth + fsv.weeks_from_birth_due * 7) between CURRENT_DATE - 180 AND CURRENT_DATE + 730
  --order by fp.patient_id,fsv.vaccine_id, fsv.index
  ),
  patient_vaccine_dynamic_schedule as (
  select
	  distinct on (fp.patient_id, fsv2.vaccine_category, fsv2.vaccine_id)
	  fp.patient_id,
	  fsv2.scheduled_vaccine_id,
	  fsv2.vaccine_category,
	  fsv2.vaccine_id,
	  fsv2.weeks_from_last_vaccination_due * 7 + fav.administered_date due_date
  from filtered_administered_vaccines fav
  join filtered_patients fp on fp.patient_id = fav.patient_id
  join filtered_scheduled_vaccines fsv on fsv.scheduled_vaccine_id  = fav.scheduled_vaccine_id
  join filtered_scheduled_vaccines fsv2 on fsv.vaccine_id = fsv2.vaccine_id and fsv.vaccine_category = fsv2.vaccine_category and fsv2.weeks_from_birth_due is null and fsv2.weeks_from_last_vaccination_due is not null and fsv2.index > fsv.index
  left join filtered_administered_vaccines fav2 on fav2.patient_id = fp.patient_id and fav2.scheduled_vaccine_id = fsv2.scheduled_vaccine_id
  where fav2.scheduled_vaccine_id is null
  order by fp.patient_id, fsv2.vaccine_category, fsv2.vaccine_id, fsv2.index
  ),
  patient_vaccine_schedule as (
	  select * from patient_vaccine_fixed_schedule
	  union all
	  select * from patient_vaccine_dynamic_schedule where due_date  between CURRENT_DATE - 180 and CURRENT_DATE + 730
  )
  SELECT
	  *,
	  pvs.due_date - CURRENT_DATE days_till_due,
	  (SELECT vst.status
	  FROM vaccine_thresholds vst
	  WHERE pvs.due_date - CURRENT_DATE > vst.threshold
	  ORDER BY vst.threshold DESC
	  LIMIT 1) AS status
  FROM patient_vaccine_schedule pvs;
	`,
    {
      replacements: {
        thresholdsDefault: JSON.stringify([
          {
            threshold: 28,
            status: 'SCHEDULED',
          },
          {
            threshold: 7,
            status: 'UPCOMING',
          },
          {
            threshold: -7,
            status: 'DUE',
          },
          {
            threshold: -55,
            status: 'OVERDUE',
          },
          {
            threshold: '-Infinity',
            status: 'MISSED',
          },
        ]),
        ageLimitDefault: '15',
      },
    },
  );
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query(`DROP VIEW upcoming_vaccinations;`);
}
