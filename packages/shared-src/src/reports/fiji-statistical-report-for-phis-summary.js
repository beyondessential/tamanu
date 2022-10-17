/* eslint-disable no-param-reassign, camelcase, no-unused-vars */

import {
  format,
  differenceInMilliseconds,
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
} from 'date-fns';
import { groupBy } from 'lodash';
import { toDateTimeString } from '../utils/dateTime';

import { generateReportFromQueryData } from './utilities';

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

const ETHNICITY_PREFIX_BY_ID = {
  [ETHNICITY_IDS.ITAUKEI]: 'itaukei',
  [ETHNICITY_IDS.INDIAN]: 'fid',
  [ETHNICITY_IDS.OTHERS]: 'others',
};

const query = `
with
  cte_oldest_date as (
    SELECT
      greatest(:from_date::date, least(oldest_sr::date, oldest_encounter::date)) oldest_date
    FROM (
      select
        (select min(sr.end_time) from survey_responses sr) oldest_sr,
        (select min(e.start_date) from encounters e) oldest_encounter
    ) old_date_options_table
  ),
  cte_newest_date as (
    SELECT least(:to_date::date, now()) newest_date
  ),
  cte_dates as (
    select generate_series(oldest_date, newest_date, '1 day')::date date from cte_oldest_date cross join cte_newest_date
  ),
  cte_patient as (
    select
      p.id,
      coalesce(ethnicity_id, '-') as ethnicity_id, -- join on NULL = NULL returns no rows
      date_of_birth::date
    from patients p
    left JOIN patient_additional_data AS additional_data ON additional_data.id =
      (SELECT id
        FROM patient_additional_data
        WHERE patient_id = p.id
        order by ethnicity_id asc, medical_area_id asc, nursing_zone_id asc, division_id asc, village_id asc, updated_at desc
        LIMIT 1)
    where
      coalesce(medical_area_id, '-') = coalesce(:medical_area, medical_area_id, '-')
    and coalesce(nursing_zone_id, '-') = coalesce(:nursing_zone, nursing_zone_id, '-')
    and coalesce(division_id, '-') = coalesce(:division, division_id, '-')
    and coalesce(village_id, '-') = coalesce(:village, village_id, '-')
  ),
  cte_all_options as (
    select distinct
      ethnicity_id,
      under_30
    from cte_patient
    cross join (
      select true under_30
      UNION ALL
      select false under_30
    ) both_bool_options
  ),
  cte_cvd_responses as (
    select
      1 as exist,
      ethnicity_id,
      (date_of_birth::date + interval '30 year') > sr.end_time::date as under_30,
      sr.end_time::date as date,
      count(*) as enc_n
    from -- Only selects the last cvd survey response per patient/date_group
      (SELECT
          e.patient_id,
          sr4.end_time::date as date_group,
          max(sr4.end_time) AS max_end_time
        FROM
          survey_responses sr4
      join encounters e on e.id = sr4.encounter_id
      where survey_id = 'program-fijincdprimaryscreening-fijicvdprimaryscreen2'
      GROUP by e.patient_id, date_group
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
      (date_of_birth::date + interval '30 year') > snap_response.end_time::date as under_30,
      snap_response.end_time::date as date,
      count(*) as snap_n
    FROM
          survey_responses snap_response
    join survey_response_answers sra on snap_response.id  = sra.response_id
    join encounters sr_encounter
    on sr_encounter.id = snap_response.encounter_id
    join cte_patient cp on cp.id = sr_encounter.patient_id
    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
    and sra.body = 'Yes'
    group by ethnicity_id, under_30, date
  ),
  cte_diabetes_diagnoses as (
    select 1 as exist, diagnosis_encounter.start_date::date as diagnosis_date, patient_id from encounter_diagnoses ed
      join reference_data rd
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id
      join encounters diagnosis_encounter
      on ed.encounter_id = diagnosis_encounter.id
      WHERE rd.code IN ('icd10-E11') and certainty not in ('disproven','error')
  ),
  cte_hypertension_diagnoses as (
    select 1 as exist, diagnosis_encounter.start_date::date as diagnosis_date, patient_id from encounter_diagnoses ed
      join reference_data rd
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id
      join encounters diagnosis_encounter
      on ed.encounter_id = diagnosis_encounter.id
      WHERE rd.code in ('icd10-I10') and certainty not in ('disproven','error')
  ),
  cte_diagnoses as (
    select
      cp.id,
      coalesce(cdd.diagnosis_date, chd.diagnosis_date) date,
      max(cdd.exist) as a,
      max(chd.exist) as b
    from cte_patient cp
    left join cte_hypertension_diagnoses chd
    on cp.id = chd.patient_id
    left join cte_diabetes_diagnoses cdd
    on cp.id = cdd.patient_id
    and (cdd.diagnosis_date = chd.diagnosis_date or chd.diagnosis_date is null)
    where cdd.diagnosis_date is not null or chd.diagnosis_date is not null
    group by cp.id, date
  ),
  cte_aggregated_diagnoses as (
    select
      1 as exist,
      ethnicity_id,
      (date_of_birth::date + interval '30 year') > date as under_30,
      date,
      count(case when a is not null and b is null then 1 end) as diabetes_n,
      count(case when a is null and b is not null then 1 end) as hypertension_n,
      count(case when a is not null and b is not null then 1 end) as dual_n
    FROM cte_diagnoses
    join cte_patient cp
    on cp.id = cte_diagnoses.id
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
cross join cte_all_options as cao
left join cte_cvd_responses ce on
  ce.date = cd.date
and ce.ethnicity_id = cao.ethnicity_id
and ce.under_30 = cao.under_30
left join cte_snaps cs on
  cs.date = cd.date
and cs.ethnicity_id = cao.ethnicity_id
and cs.under_30 = cao.under_30
left join cte_aggregated_diagnoses cdg on
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
  total_cvd_responses: 'Number of CVD screenings',
  total_snaps: 'Number of individuals that have received SNAP counselling',
  u30_diabetes: 'Number of new diabetes cases for individuals under 30',
  o30_diabetes: 'Number of new diabetes cases for individuals above 30',
  u30_hypertension: 'Number of new hypertension cases for individuals under 30',
  o30_hypertension: 'Number of new hypertension cases for individuals above 30',
  u30_dual: 'Number of new dual diabetes and hypertension cases for individuals under 30',
  o30_dual: 'Number of new dual diabetes and hypertension cases for individuals above 30',
  itaukei_cvd_responses: 'Number of CVD screenings by Itaukei',
  itaukei_snaps: 'Number of individuals that have received SNAP counselling by Itaukei',
  itaukei_u30_diabetes: 'Number of new diabetes cases for individuals under 30 by Itaukei',
  itaukei_o30_diabetes: 'Number of new diabetes cases for individuals above 30 by Itaukei',
  itaukei_u30_hypertension: 'Number of new hypertension cases for individuals under 30 by Itaukei',
  itaukei_o30_hypertension: 'Number of new hypertension cases for individuals above 30 by Itaukei',
  itaukei_u30_dual:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei',
  itaukei_o30_dual:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei',
  fid_cvd_responses: 'Number of CVD screenings by Fijian of Indian descent',
  fid_snaps:
    'Number of individuals that have received SNAP counselling by Fijian of Indian descent',
  fid_u30_diabetes:
    'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent',
  fid_o30_diabetes:
    'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent',
  fid_u30_hypertension:
    'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent',
  fid_o30_hypertension:
    'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent',
  fid_u30_dual:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent',
  fid_o30_dual:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent',
  others_cvd_responses: 'Number of CVD screenings by ethnicity Other',
  others_snaps: 'Number of individuals that have received SNAP counselling by ethnicity Other',
  others_u30_diabetes: 'Number of new diabetes cases for individuals under 30 by ethnicity Other',
  others_o30_diabetes: 'Number of new diabetes cases for individuals above 30 by ethnicity Other',
  others_u30_hypertension:
    'Number of new hypertension cases for individuals under 30 by ethnicity Other',
  others_o30_hypertension:
    'Number of new hypertension cases for individuals above 30 by ethnicity Other',
  others_u30_dual:
    'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other',
  others_o30_dual:
    'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other',
};

const reportColumnTemplate = Object.entries(FIELD_TO_TITLE).map(([key, title]) => ({
  title,
  accessor: data => data[key] || 0,
}));

function sumObjectsByKey(objs) {
  return objs.reduce((a, b) => {
    for (const k of Object.keys(b)) {
      a[k] = (parseInt(a[k], 10) || 0) + parseInt(b[k], 10);
    }
    return a;
  }, {});
}

const makeDemographicsKey = (ethnicity, under30) =>
  `${ETHNICITY_PREFIX_BY_ID[ethnicity]}_${under30 ? 'u30' : 'o30'}`;

/**
 * The logic here is pretty opaque, but basically it creates a series of arrays of results,
 * where each array is the results which match a certain demographic (i.e.
 *  - total - all demographics,
 *  - u30 - under 30
 *  - fid_u30 - FID under 30 (this one is autogenerated by groupableResults)
 * )
 *
 * Then, the results for all entries in those arrays are summed
 *
 */
const transformResultsForDate = (thisDate, resultsForDate) => {
  const groupableResults = resultsForDate.map(
    ({ ethnicity_id, under_30, date, ...summableKeys }) => ({
      groupingKey: makeDemographicsKey(ethnicity_id, under_30),
      ...summableKeys,
    }),
  );

  // guaranteed to have only 1 entry per group
  const resultsBySpecificDemographic = groupBy(groupableResults, 'groupingKey');

  const dataGroupedByDemographic = {
    total: resultsForDate,
    u30: resultsForDate.filter(({ under_30 }) => under_30 === true),
    o30: resultsForDate.filter(({ under_30 }) => under_30 === false),
    itaukei: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.ITAUKEI),
    fid: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.INDIAN),
    others: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.OTHERS),
    ...resultsBySpecificDemographic,
  };

  const dataByDemographic = Object.entries(dataGroupedByDemographic).reduce(
    (prev, [key, data]) => ({
      ...prev,
      [key]: sumObjectsByKey(
        data.map(({ ethnicity_id, under_30, date, ...summableKeys }) => summableKeys),
      ),
    }),
    {},
  );

  return {
    date: thisDate,
    ...Object.entries(dataByDemographic).reduce(
      (acc, [demographicKey, data]) => ({
        ...acc,
        ...Object.entries(data).reduce(
          (acc2, [dataKey, value]) => ({
            ...acc2,
            [`${demographicKey}_${dataKey}`]: parseInt(value),
          }),
          {},
        ),
      }),
      {},
    ),
  };
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const { medicalArea, nursingZone, division, village, fromDate, toDate } = parameters;

  const queryFromDate = toDateTimeString(
    startOfDay(fromDate ? parseISO(fromDate) : subDays(new Date(), 30)),
  );
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      medical_area: medicalArea ?? null,
      nursing_zone: nursingZone ?? null,
      division: division ?? null,
      village: village ?? null,
      from_date: queryFromDate,
      to_date: queryToDate ?? null,
    },
  });

  const reportData = Object.entries(groupBy(results, 'date'))
    .map(([date, resultsForDate]) => transformResultsForDate(date, resultsForDate))
    // Sort oldest to most recent
    .sort(({ date: date1 }, { date: date2 }) =>
      differenceInMilliseconds(new Date(date1), new Date(date2)),
    )
    .map(({ date, ...otherFields }) => ({
      date: format(parseISO(date), 'dd-MM-yyyy'),
      ...otherFields,
    }));

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
