`
select * from (
  SELECT 
    sr.end_time::date as "Date",
    count(distinct(patient.id)) as patients_screened, -- testing
    count(*) as number_of_cvd_screenings,
    count(case when snap_counciling_table.snap_counciling = 'Yes' then 1 end) as "Number of individuals that have received SNAP counselling",
    count(case when additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as screened_itaukei,
    count(case when snap_counciling_table.snap_counciling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as "Number of ITaukei that have received SNAP counselling",
    count(case when additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as screened_indian,
    count(case when snap_counciling_table.snap_counciling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as "Number of FID that have received SNAP counselling",
    count(case when additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as "screened_others",
    count(case when snap_counciling_table.snap_counciling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as "Number of others that have received SNAP counselling"
  FROM patients AS patient
  join (
      SELECT
          e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
       FROM
          survey_responses sr4
      join encounters e on e.id = sr4.encounter_id 
        GROUP by e.patient_id, sr4.end_time::date
    ) max_time_per_group_table
  on max_time_per_group_table.patient_id = patient.id
  inner JOIN survey_responses AS sr 
    ON sr.end_time = max_time_per_group_table.max_end_time
  inner join encounters sr_encounter
  on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = patient.id
  left join patient_additional_data as additional_data on 
    additional_data.id = (
      select id from patient_additional_data 
      where patient_id = patient.id
      limit 1
    )
  left join (
    select response_id, body as snap_counciling from survey_response_answers sra
    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
  ) snap_counciling_table on sr.id = snap_counciling_table.response_id
  group by "Date" order by "Date" desc) table1
  join (
    SELECT 
      e.start_date::date as "Date",
      count(distinct(p.id)) as unique_patients_with_encounters,
      count(*) as encounters_that_day,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date then 1 end) as diabetes_u30,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date then 1 end) as diabetes_o30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') > current_date then 1 end) as hypertension_u30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') <= current_date then 1 end) as hypertension_o30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date then 1 end) as dual_u30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date then 1 end) as dual_o30,
      'buffer' as buffer,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_diabetes_u30,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_diabetes_o30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_hypertension_u30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_hypertension_o30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_dual_u30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_dual_o30,
      'buffer' as buffer,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_diabetes_u30,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_diabetes_o30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_hypertension_u30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_hypertension_o30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_dual_u30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as FID_dual_o30,
      'buffer' as buffer,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_diabetes_u30,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_diabetes_o30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_hypertension_u30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_hypertension_o30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_dual_u30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_dual_o30
    FROM patients AS p
    left join patient_additional_data as additional_data on 
    additional_data.id = (
      select id from patient_additional_data 
      where patient_id = p.id
      limit 1
    )
    join encounters e on e.patient_id = p.id
    left join (
      select encounter_id, ed.id from encounter_diagnoses ed
      WHERE diagnosis_id IN ('ref/icd10/E23.2', 'icd10-U07-1') -- note ref/icd10/Z01.1 is for testing only
    ) diabetes_temp on e.id = diabetes_temp.encounter_id
    left join (
      select encounter_id, ed.id from encounter_diagnoses ed
      WHERE diagnosis_id IN ('ref/icd10/E23.2', 'ref/icd10/G51.0') -- note ref/icd10/G51.0 is for testing only
    ) hypertension_temp on e.id = hypertension_temp.encounter_id
    group by "Date" 
    having count(diabetes_temp.id) > 0 or count(hypertension_temp.id) > 0
  ) table2
  on table1."Date" = table2."Date";
  `;
