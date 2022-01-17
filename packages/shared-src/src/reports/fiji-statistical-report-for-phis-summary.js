import moment from 'moment';
import { groupBy, keyBy } from 'lodash';

import { generateReportFromQueryData } from './utilities';

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

const ETHNICITY_IDS_BACKWARDS = {
  'ethnicity-ITaukei': 'itaukei',
  'ethnicity-FID': 'fid',
  'ethnicity-others': 'others',
};

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
    left JOIN patient_additional_data AS additional_data ON additional_data.id =
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
  `${ETHNICITY_IDS_BACKWARDS[ethnicity]}_${under30 ? 'u30' : 'o30'}`;

const transformResultsForDate = (date, resultsForDate) => {
  // console.log('resultsForDate', resultsForDate);

  const groupableResults = resultsForDate.map(
    ({ ethnicity_id, under_30, date, ...summableKeys }) => ({
      groupingKey: makeDemographicsKey(ethnicity_id, under_30),
      ...summableKeys,
    }),
  );

  const resultsByDemographic = keyBy(groupableResults, 'groupingKey');

  const reportableCategoriesAndData = {
    total: resultsForDate,
    u30: resultsForDate.filter(({ under_30 }) => under_30 === true),
    o30: resultsForDate.filter(({ under_30 }) => under_30 === false),
    itaukei: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.ITAUKEI),
    fid: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.INDIAN),
    others: resultsForDate.filter(({ ethnicity_id }) => ethnicity_id === ETHNICITY_IDS.OTHERS),
  };

  const dataAbc = Object.entries(reportableCategoriesAndData).reduce(
    (prev, [key, data]) => ({
      ...prev,
      [key]: sumObjectsByKey(
        data.map(({ ethnicity_id, under_30, date, ...summableKeys }) => summableKeys),
      ),
    }),
    resultsByDemographic,
  );
  // ...resultsByDemographic,
  console.log(dataAbc);

  return {
    date: date,
    ...Object.entries(dataAbc).reduce(
      (acc, [key, data]) => ({
        ...acc,
        ...Object.entries(data).reduce(
          (acc2, [key2, value]) => ({
            ...acc2,
            [`${key}_${key2}`]: parseInt(value),
          }),
          {},
        ),
      }),
      {},
    ),
  };
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

  console.log(reportData);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
/*


CREATE EXTENSION IF NOT EXISTS tablefunc;

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
			ethnicity_id,
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
			(date_of_birth + interval '30 year') <= CURRENT_DATE as under_30
		from patients p
		JOIN patient_additional_data AS additional_data ON additional_data.id =
		  (SELECT id
		   FROM patient_additional_data
		   WHERE patient_id = p.id
		   LIMIT 1)
	),
	cte_encounters as (
		select
			1 as exist,
			ethnicity_id,
			under_30,
			sr.end_time::date as date,
			count(*) as enc_n
		from survey_responses sr
		join encounters e on e.id = sr.encounter_id
		join cte_patient cp on cp.id = e.patient_id
		group by ethnicity_id, under_30, sr.end_time::date
	),
	abc as (
		select
			1 as exist,
			ethnicity_id,
			under_30,
			sr.end_time::date as date,
			count(*) as enc_n
		from 
			(SELECT
		      e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
		   FROM
		      survey_responses sr4
		  join encounters e on e.id = sr4.encounter_id 
		    GROUP by e.patient_id, sr4.end_time::date
		) max_time_per_group_table
		inner JOIN survey_responses AS sr 
		ON sr.end_time = max_time_per_group_table.max_end_time
		inner join encounters sr_encounter
		on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = max_time_per_group_table.patient_id
		join cte_patient cp on cp.id = sr_encounter.patient_id 
		group by ethnicity_id, under_30, sr.end_time::date)
select
	cd.date,
	cao.ethnicity_id,
	cao.under_30,
	enc_n
from cte_dates cd
full outer join cte_all_options cao
on true
left join abc ce on 
	ce.date = cd.date
and ce.ethnicity_id = cao.ethnicity_id
and ce.under_30 = cao.under_30;

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
					or  sum(coalesce(cdg.dual_n,0)) > 0
					
--todo add hyp + dual
		




select * 
	from crosstab($$
		SELECT date::text, concat(ethnicity_id, '__', under_30::text), diabetes::int from (
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
				),
				all_results as (
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
--todo add hyp + dual
				) 
	select * from all_results
	) x
$$,
$$
with
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
	)
select distinct concat(ethnicity_id, '__', under_30::text) from cte_all_options
$$)
as ct(a text, 
"-__false" int,
"-__true" int,
"ethnicity-AmericanSamoa__false" int,
"ethnicity-Australia__false" int,
"ethnicity-Australia__true" int,
"ethnicity-Fiji__false" int,
"ethnicity-Fiji__true" int,
"ethnicity-FrenchPolynesia__false" int,
"ethnicity-Kiribati__true" int,
"ethnicity-Nauru__true" int,
"ethnicity-NewZealand__true" int,
"ethnicity-Tonga__false" int,
"ethnicity-Tonga__true" int,
"ethnicity-Vanuatu__false" int,
"ethnicity-Vanuatu__true" int
);


select encounter_id, ed.id from encounter_diagnoses ed
			join reference_data rd 
			on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
			WHERE rd.code IN ('icd10-E11')
			or rd.code like '%%'


SELECT * 
FROM crosstab('SELECT first_name, sex, date_of_birth from patients') 
as ct(a varchar, male timestamptz, female timestamptz);

// -- other file


explain analyze select * from (
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


SELECT 
	e.start_date::date as "Date",
	count(distinct(p.id)) as unique_patients_with_encounters,
	count(*) as encounters_that_day,
	count(diabetes_temp.id) as diabetes,
	count(hypertension_temp.id) as hypertension,
	count(case when hypertension_temp.id is not null and diabetes_temp.id is not null then 1 end) as dual
FROM patients AS p
join encounters on e.patient_id = p.id
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
order by "Date" desc;


	select diagnosis_id, count(*) from encounter_diagnoses ed
	group by diagnosis_id order by count(*) desc

-- Time: 18259.649, 18757.425, 18908.805



SELECT sr.id, sr.end_time, patient.first_name, patient.sex, patient.date_of_birth, additional_data.ethnicity_id, snap_counciling_table.snap_counciling
FROM patients AS patient
inner JOIN survey_responses AS sr ON 
	sr.id in (
		select sr2.id from survey_responses sr2 
		join encounters sr_encounter
			on sr_encounter.id = sr2.encounter_id
		join (
    		SELECT
        		e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
   			FROM
        		survey_responses sr4
        	join encounters e on e.id = sr4.encounter_id 
    		GROUP BY
     		    e.patient_id, sr4.end_time::date
    		) max_time_per_group_table
    	on 
    			max_time_per_group_table.patient_id = sr_encounter.patient_id
    		and max_time_per_group_table.date_group = sr2.end_time::date
    		and max_time_per_group_table.max_end_time = sr2.end_time
    	where patient.id = max_time_per_group_table.patient_id
	)
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
order by sr.end_time desc;


SELECT 
    sr.end_time::date as "Date",
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
  group by "Date" order by "Date" desc;

-- HELPFUL UTIL TO DETERMINE MULTIPLE SR ON THE SAME DAY
select sr.end_time::date as "Date", p.id, p.first_name, p.last_name, count(*) as "Count" from survey_responses sr 
join encounters e on e.id = sr.encounter_id 
join patients p on p.id = e.patient_id
group by p.id, "Date"
order by "Count" desc

select * from (
  SELECT 
    sr.end_time::date as "Date",
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
  group by "Date" order by "Date" desc) table1
  left outer join (
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
    group by "Date" 
    having count(diabetes_temp.id) > 0 or count(hypertension_temp.id) > 0
  ) table2
  on table1."Date" = table2."Date";

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
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code IN ('icd10-E11')
    ) diabetes_temp on e.id = diabetes_temp.encounter_id
    left join (
      select encounter_id, ed.id from encounter_diagnoses ed
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code IN ('icd10-I10')
    ) hypertension_temp on e.id = hypertension_temp.encounter_id
    group by "Date" 
    having count(diabetes_temp.id) > 0 or count(hypertension_temp.id) > 0;
 
 
explain  (format json) select sr.end_time, response_id, body as snap_counciling from survey_response_answers sra
	join survey_responses sr on sra.response_id = sr.id
	
	
	join encounters e on sr.encounter_id = e.id 
	join patients p on e.patient_id = p.id
	
where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
order by sr.end_time desc;


select 
case when diagnosis_date is null then 
case when sr_date is null then snap_date else sr_date end
  else diagnosis_date end as date,
      count(distinct(patient.id)) as unique_patients_with_encounters,
      count(*) as encounters_that_day,
      count(case when diabetes_diagnosed then 1 end) as diabetes_u30,
      count(case when snap_counselling_table.snap_counselling = 'Yes' then 1 end) as received_snap_counselling,
      count(case when snap_counselling_table.snap_counselling = 'Yes' then 1 end) as received_snap_counselling,
count(case when additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as screened_itaukei,
count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as received_snap_counselling_itaukei,
count(case when additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as screened_fid,
count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as received_snap_counselling_fid,
count(case when additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as screened_others,
count(case when snap_counselling_table.snap_counselling = 'Yes' and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as received_snap_counselling_itaukei_others,
count(*) as encounters_that_day,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date then 1 end) as diabetes_u30,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date then 1 end) as diabetes_o30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') > current_date then 1 end) as hypertension_u30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') <= current_date then 1 end) as hypertension_o30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date then 1 end) as dual_u30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date then 1 end) as dual_o30,
'buffer' as buffer,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_diabetes_u30,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_diabetes_o30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_hypertension_u30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_hypertension_o30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_dual_u30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as itaukei_dual_o30,
'buffer' as buffer,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_diabetes_u30,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_diabetes_o30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_hypertension_u30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_hypertension_o30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_dual_u30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as fid_dual_o30,
'buffer' as buffer,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_diabetes_u30,
count(case when diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_diabetes_o30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_hypertension_u30,
count(case when hypertension_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_hypertension_o30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') > current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_dual_u30,
count(case when hypertension_diagnosed and diabetes_diagnosed and (date_of_birth + interval '30 year') <= current_date and additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as others_dual_o30
from patients AS patient
  	join patient_additional_data as additional_data on 
    	additional_data.id = (
     	 select id from patient_additional_data 
     	 where patient_id = patient.id
     	 limit 1
    )
	left join (
		select *, sr_encounter.patient_id as pid, sr.end_time::date as sr_date from (
	      SELECT
	          e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
	       FROM
	          survey_responses sr4
	      join encounters e on e.id = sr4.encounter_id 
	        GROUP by e.patient_id, sr4.end_time::date
	    ) max_time_per_group_table
	  inner JOIN survey_responses AS sr 
	    ON sr.end_time = max_time_per_group_table.max_end_time
	  inner join encounters sr_encounter
	  on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = max_time_per_group_table.patient_id
  ) cvd_response_table
  on cvd_response_table.pid = patient.id
  full outer join (
    select 
    	*,
    	diagnosis_encounter.start_date::date as diagnosis_date,
    	diabetes_temp.id is not null as diabetes_diagnosed,
    	hypertension_temp.id is not null as hypertension_diagnosed
    from encounters diagnosis_encounter
    left join (
      select encounter_id, ed.id from encounter_diagnoses ed
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code IN ('icd10-E11')
    ) diabetes_temp on diagnosis_encounter.id = diabetes_temp.encounter_id
    left join (
      select encounter_id, ed.id from encounter_diagnoses ed
      join reference_data rd 
      on rd."type" = 'icd10' and rd.id = ed.diagnosis_id 
      WHERE rd.code like ('icd10-I10')
    ) hypertension_temp on diagnosis_encounter.id = hypertension_temp.encounter_id
  ) diagnosis_table
  on diagnosis_table.patient_id = patient.id
  full outer join (
  	select patient_id, sr.id, body as snap_counselling, sr.end_time::date as snap_date from (
      SELECT
          snap_encounter.patient_id, snap_response.end_time::date as date_group, max(snap_response.end_time) AS max_end_time , count(*) as count_for_testing 
       FROM
          survey_response_answers sra
        join survey_responses snap_response
      on snap_response.id = sra.response_id 
      join encounters snap_encounter
      on snap_encounter.id = snap_response.encounter_id 
      where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
      and sra.body = 'Yes'
        GROUP by snap_encounter.patient_id, snap_response.end_time::date
    ) max_time_per_group_table
    JOIN survey_responses AS sr 
    ON sr.end_time = max_time_per_group_table.max_end_time
    join survey_response_answers sra on sr.id  = sra.response_id
    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
  ) snap_counselling_table
  on snap_counselling_table.patient_id = patient.id
  group by date order by date desc;
-- Henri's attempt

SELECT 
  sr.end_time::date as "Date",
  count(distinct(patient.id)) as patients_screened,
  count(*) as patients_screened,
  count(case when additional_data.ethnicity_id = 'ethnicity-ITaukei' then 1 end) as 
screened_itaukei,
  count(case when additional_data.ethnicity_id = 'ethnicity-FID' then 1 end) as 
screened_indian,
  count(case when additional_data.ethnicity_id = 'ethnicity-others' then 1 end) as 
"screened_others",
  count(case when snap_counciling_table.snap_counciling = 'Yes' then 1 end) as 
"Number of individuals that have received SNAP counselling",
  count(CASE WHEN diabetes = 1 THEN 1 END) as diabetes,
  count(CASE WHEN hypertension = 1 THEN 1 END) as hypertension,
  count(CASE WHEN diabetes = 1 and hypertension = 1 THEN 1 END) as diabetes_hypertension,
  count(CASE WHEN (date_of_birth + interval '30 year') > current_date THEN 1 END) AS bellow30,
  count(CASE WHEN (date_of_birth + interval '30 year') <= current_date THEN 1 END) AS morethan30
FROM patients AS patient
  inner JOIN survey_responses AS sr on
    sr.id in (
      select sr2.id from survey_responses sr2
      join encounters sr_encounter 
      on sr_encounter.patient_id = patient.id and sr_encounter.id = sr2.encounter_id
      join (
           select
           		e.patient_id,
                sr4.end_time::date as date_group,
                max(sr4.end_time) AS max_end_time,
                count(*) as count_for_testing 
             from survey_responses sr4 
             join encounters e on e.id = sr4.encounter_id 
             GROUP BY e.patient_id, sr4.end_time::date
           ) max_time_per_group_table 
           on max_time_per_group_table.patient_id = sr_encounter.patient_id 
             and max_time_per_group_table.date_group = sr2.end_time::date 
             and max_time_per_group_table.max_end_time = sr2.end_time
           where patient.id = max_time_per_group_table.patient_id 
           order by date_group
      ) 
  left join patient_additional_data as additional_data on additional_data.id = (select id from patient_additional_data where patient_id = patient.id limit 1) 
  left join (select response_id, body as snap_counciling from survey_response_answers sra where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')) snap_counciling_table on 
    sr.id = snap_counciling_table.response_id
  left join (select patient_id, 1 AS diabetes from encounters INNER JOIN encounter_diagnoses ON encounter_id = encounters.id WHERE diagnosis_id IN 
     ('ref/icd10/E23.2')GROUP BY patient_id) diabetes_temp on diabetes_temp.patient_id = patient.id 
  left join (select patient_id, 1 AS hypertension from encounters INNER JOIN encounter_diagnoses ON encounter_id = encounters.id WHERE diagnosis_id IN ('ref/icd10/I10') GROUP BY patient_id) hypertension_temp on hypertension_temp.patient_id = patient.id 
     group by "Date" order by "Date" desc;

-- other file

select 
	  date,
      count(case when snap_counselling_table.snap_counselling = 'Yes' then 1 end) as received_snap_counselling
      from patients AS patient
  	join patient_additional_data as additional_data on 
    	additional_data.id = (
     	 select id from patient_additional_data 
     	 where patient_id = patient.id
     	 limit 1
    )
    left join (
		select *, sr_encounter.patient_id as pid, sr.end_time::date as date from (
	      SELECT
	          e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
	       FROM
	          survey_responses sr4
	      join encounters e on e.id = sr4.encounter_id 
	        GROUP by e.patient_id, sr4.end_time::date
	    ) max_time_per_group_table
	  inner JOIN survey_responses AS sr 
	    ON sr.end_time = max_time_per_group_table.max_end_time
	  inner join encounters sr_encounter
	  on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = max_time_per_group_table.patient_id
  ) cvd_response_table
  on cvd_response_table.pid = patient.id
  full outer join (
  	select patient_id, sr.id, body as snap_counselling, sr.end_time::date as snap_date from (
	      SELECT
	          snap_encounter.patient_id, snap_response.end_time::date as date_group, max(snap_response.end_time) AS max_end_time , count(*) as count_for_testing 
	       FROM
	          survey_response_answers sra
	        join survey_responses snap_response
		  	on snap_response.id = sra.response_id 
		  	join encounters snap_encounter
		  	on snap_encounter.id = snap_response.encounter_id 
		    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
	        GROUP by snap_encounter.patient_id, snap_response.end_time::date
	    ) max_time_per_group_table
	    JOIN survey_responses AS sr 
	    ON sr.end_time = max_time_per_group_table.max_end_time
	    join survey_response_answers sra on sr.id  = sra.response_id
	    where sra.data_element_id in ('pde-FijCVD038', 'pde-FijSNAP13')
  ) snap_counselling_table
  on snap_counselling_table.patient_id = patient.id and snap_counselling_table.snap_date = cvd_response_table.date
  group by date;
 
*/
