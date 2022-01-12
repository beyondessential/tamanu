import { generateReportFromQueryData } from './utilities';

const query = `
select *, case when "Date1" is null then "Date2" else "Date1" end as date from (
  SELECT 
    sr.end_time::date as "Date1",
    count(distinct(patient.id)) as patients_screened, -- testing
    count(*) as number_of_cvd_screenings,
    count(case when snap_counselling_table.snap_counselling = 'Yes' then 1 end) as received_snap_counselling,
    count(case when additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as screened_itaukei,
    count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as received_snap_counselling_itaukei,
    count(case when additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as screened_fid,
    count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as received_snap_counselling_fid,
    count(case when additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as screened_others,
    count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as received_snap_counselling_itaukei_others
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
    select response_id, body as snap_counselling from survey_response_answers sra
    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
  ) snap_counselling_table on sr.id = snap_counselling_table.response_id
  group by "Date1" order by "Date1" desc) table1
  full outer join (
    SELECT 
      e.start_date::date as "Date2",
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
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_diabetes_u30,
      count(case when diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_diabetes_o30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_hypertension_u30,
      count(case when hypertension_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_hypertension_o30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_dual_u30,
      count(case when hypertension_temp.id is not null and diabetes_temp.id is not null and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_dual_o30,
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
    group by "Date2" 
    having count(diabetes_temp.id) > 0 or count(hypertension_temp.id) > 0
  ) table2
  on table1."Date1" = table2."Date2";
  `;

const FIELD_TO_TITLE = {
  date: 'Date',
  number_of_cvd_screenings: 'Number of CVD screenings',
  received_snap_counselling: 'Number of individuals that have received SNAP counselling',
  diabetes_u30: 'Number of new diabetes cases for individuals under 30',
  diabetes_o30: 'Number of new diabetes cases for individuals above 30',
  hypertension_u30: 'Number of new hypertension cases for individuals under 30',
  hypertension_o30: 'Number of new hypertension cases for individuals above 30',
  dual_u30: 'Number of new dual diabetes and hypertension cases for individuals under 30',
  dual_o30: 'Number of new dual diabetes and hypertension cases for individuals above 30',
  screened_itaukei: 'Number of CVD screenings by Itaukei',
  received_snap_counselling_itaukei:
    'Number of individuals that have received SNAP counselling by Itaukei',
  itaukei_diabetes_u30: 'Number of new diabetes cases for individuals under 30 by Itaukei',
  itaukei_diabetes_o30: 'Number of new diabetes cases for individuals above 30 by Itaukei',
  itaukei_hypertension_u30: 'Number of new hypertension cases for individuals under 30 by Itaukei',
  itaukei_hypertension_o30: 'Number of new hypertension cases for individuals above 30 by Itaukei',
  itaukei_dual_u30:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei',
  itaukei_dual_o30:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei',
  screened_fid: 'Number of CVD screenings by Fijian of Indian descent',
  received_snap_counselling_fid:
    'Number of individuals that have received SNAP counselling by Fijian of Indian descent',
  fid_diabetes_u30:
    'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent',
  fid_diabetes_o30:
    'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent',
  fid_hypertension_u30:
    'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent',
  fid_hypertension_o30:
    'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent',
  fid_dual_u30:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent',
  fid_dual_o30:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent',
  screened_others: 'Number of CVD screenings by ethnicity Other',
  received_snap_counselling_itaukei_others:
    'Number of individuals that have received SNAP counselling by ethnicity Other',
  others_diabetes_u30: 'Number of new diabetes cases for individuals under 30 by ethnicity Other',
  others_diabetes_o30: 'Number of new diabetes cases for individuals above 30 by ethnicity Other',
  others_hypertension_u30:
    'Number of new hypertension cases for individuals under 30 by ethnicity Other',
  others_hypertension_o30:
    'Number of new hypertension cases for individuals above 30 by ethnicity Other',
  others_dual_u30:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other',
  others_dual_o30:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other',
};

const reportColumnTemplate = Object.entries(FIELD_TO_TITLE).map(([key, title]) => ({
  title,
  accessor: data => data[key],
}));

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const rawData = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

  console.log(rawData);

  return generateReportFromQueryData(rawData, reportColumnTemplate);
};

export const permission = 'Encounter';
