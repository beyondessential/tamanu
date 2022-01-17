import { groupBy, keyBy } from 'lodash';
import { generateReportFromQueryData } from './utilities';

const query = `
with
  cte_oldest_date as (
    SELECT CASE
        WHEN col1 <= col2 THEN col1
        ELSE              col2
    END AS oldest_date FROM (
    select
      (select min(sr.end_time) as sr_oldest from survey_responses sr) as col1,
      (select min(e.start_date) as sr_oldest from encounters e) as col2
    ) aliased_table
  ),
  cte_dates as (
    select generate_series(cte_oldest_date.oldest_date, '2022-01-13 00:00'::timestamp, '1 day')::date date from cte_oldest_date
  ),
  cte_patient as (
    select
      p.id,
      coalesce(ethnicity_id, '-') as ethnicity_id, -- join on NULL = NULL returns no rows
      (date_of_birth + interval '30 year') > CURRENT_DATE as under_30
    from patients p
    JOIN patient_additional_data AS additional_data ON additional_data.id =
      (SELECT id
        FROM patient_additional_data
        WHERE patient_id = p.id
        LIMIT 1)
  ),
  cte_all_options as (
    select distinct 
      ethnicity_id,
      under_30
    from cte_patient
  ),
  cte_cvd_responses as (
    select
      1 as exist,
      ethnicity_id,
      under_30,
      sr.end_time::date as date,
      count(*) as enc_n
    from -- Only selects the last cvd survey response per patient/date_group
      (SELECT
          e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
        FROM
          survey_responses sr4
      join encounters e on e.id = sr4.encounter_id
      where survey_id = 'program-fijincdprimaryscreening-fijicvdprimaryscreen2'
      GROUP by e.patient_id, sr4.end_time::date
    ) max_time_per_group_table
    JOIN survey_responses AS sr 
    ON sr.end_time = max_time_per_group_table.max_end_time
    left join survey_response_answers sra 
    on sra.response_id = sr.id and sra.data_element_id = 'pde-FijCVD021'
    join encounters sr_encounter
    on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = max_time_per_group_table.patient_id
    join cte_patient cp on cp.id = sr_encounter.patient_id
    where sra.body is null or sra.body <> 'Ineligible'
    group by ethnicity_id, under_30, sr.end_time::date
  ),
  cte_snaps as (
    select
      1 as exist,
      ethnicity_id,
      under_30,
      snap_response.end_time::date as date,
      count(*) as snap_n
    FROM
          survey_responses snap_response
    join survey_response_answers sra on snap_response.id  = sra.response_id
    join encounters sr_encounter
    on sr_encounter.id = snap_response.encounter_id
    join cte_patient cp on cp.id = sr_encounter.patient_id
    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
    group by ethnicity_id, under_30, date
  ),
  cte_diagnoses as (
    select
      1 as exist,
      ethnicity_id,
      under_30,
      diagnosis_encounter.start_date::date as date,
      count(case when diabetes_temp.id is not null and hypertension_temp.id is null then 1 end) as diabetes_n,
      count(case when diabetes_temp.id is null and hypertension_temp.id is not null then 1 end) as hypertension_n,
      count(case when diabetes_temp.id is not null and hypertension_temp.id is not null then 1 end) as dual_n
    FROM encounters diagnosis_encounter
    left join 
      (select encounter_id, ed.id from encounter_diagnoses ed
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code IN ('icd10-E11')
      or rd.code like '%%'
      ) diabetes_temp
    on diagnosis_encounter.id = diabetes_temp.encounter_id
    left join 
      (select encounter_id, ed.id from encounter_diagnoses ed
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code in ('icd10-I10')
      ) hypertension_temp
    on diagnosis_encounter.id = hypertension_temp.encounter_id
    join cte_patient cp on cp.id = diagnosis_encounter.patient_id
    group by ethnicity_id, under_30, date
  )
select
  cd.date,
  cao.ethnicity_id,
  cao.under_30,
  sum(coalesce(ce.enc_n,0)) cvd_responses,
  sum(coalesce(cs.snap_n,0)) snaps,
  sum(coalesce(cdg.diabetes_n,0)) diabetes,
  sum(coalesce(cdg.hypertension_n,0)) hypertension,
  sum(coalesce(cdg.dual_n,0)) dual
from cte_dates cd
full outer join cte_all_options as cao
on true
left join cte_cvd_responses ce on 
  ce.date = cd.date
and ce.ethnicity_id = cao.ethnicity_id
and ce.under_30 = cao.under_30
left join cte_snaps cs on 
  cs.date = cd.date
and cs.ethnicity_id = cao.ethnicity_id
and cs.under_30 = cao.under_30
left join cte_diagnoses cdg on 
  cdg.date = cd.date
and cdg.ethnicity_id = cao.ethnicity_id
and cdg.under_30 = cao.under_30
group by cao.ethnicity_id, cao.under_30, cd.date
having 
    sum(coalesce(ce.enc_n,0)) > 0
or  sum(coalesce(cs.snap_n,0)) > 0
or  sum(coalesce(cdg.diabetes_n,0)) > 0
or  sum(coalesce(cdg.hypertension_n,0)) > 0
or  sum(coalesce(cdg.dual_n,0)) > 0;
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

const makeKey = (a, b) => `${a}__&&__${b}`;

const transformResultsForDate = (date, resultsForDate) => {
  console.log('resultsForDate', resultsForDate);

  const groupableResults = resultsForDate.map(({ ethnicity, under_30, ...otherKeys }) => ({
    groupingKey: makeKey(ethnicity, under_30),
    ...otherKeys,
  }));

  const resultsByDemographic = keyBy(groupableResults, 'groupingKey');
  console.log('resultsByDemographic', resultsByDemographic);

  // const FIELD_TO_TITLE = {
  //   date,
  //   number_of_cvd_screenings: 'Number of CVD screenings',
  //   received_snap_counselling: 'Number of individuals that have received SNAP counselling',
  //   diabetes_u30: 'Number of new diabetes cases for individuals under 30',
  //   diabetes_o30: 'Number of new diabetes cases for individuals above 30',
  //   hypertension_u30: 'Number of new hypertension cases for individuals under 30',
  //   hypertension_o30: 'Number of new hypertension cases for individuals above 30',
  //   dual_u30: 'Number of new dual diabetes and hypertension cases for individuals under 30',
  //   dual_o30: 'Number of new dual diabetes and hypertension cases for individuals above 30',
  //   screened_itaukei: 'Number of CVD screenings by Itaukei',
  //   received_snap_counselling_itaukei:
  //   itaukei_diabetes_u30: 'Number of new diabetes cases for individuals under 30 by Itaukei',
  //   itaukei_diabetes_o30: 'Number of new diabetes cases for individuals above 30 by Itaukei',
  //   itaukei_hypertension_u30: 'Number of new hypertension cases for individuals under 30 by Itaukei',
  //   itaukei_hypertension_o30: 'Number of new hypertension cases for individuals above 30 by Itaukei',
  //   itaukei_dual_u30:
  //   itaukei_dual_o30:
  //   screened_fid: 'Number of CVD screenings by Fijian of Indian descent',
  //   received_snap_counselling_fid:
  //   fid_diabetes_u30:
  //   fid_diabetes_o30:
  //   fid_hypertension_u30:
  //   fid_hypertension_o30:
  //   fid_dual_u30:
  //   fid_dual_o30:
  //   screened_others: 'Number of CVD screenings by ethnicity Other',
  //   received_snap_counselling_itaukei_others:
  //   others_diabetes_u30: 'Number of new diabetes cases for individuals under 30 by ethnicity Other',
  //   others_diabetes_o30: 'Number of new diabetes cases for individuals above 30 by ethnicity Other',
  //   others_hypertension_u30:
  //   others_hypertension_o30:
  //   others_dual_u30:
  //   others_dual_o30:
  // };
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

  console.log(results);

  const reportData = Object.entries(groupBy(results, 'date'))
    .map(([date, resultsForDate]) => transformResultsForDate(date, resultsForDate))
    // Sort oldest to most recent
    .sort(({ date: date1 }, { date: date2 }) => moment(date1) - moment(date2))
    .map(({ date, ...otherFields }) => ({
      date: moment(date).format('DD-MM-YYYY'),
      ...otherFields,
    }));

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
