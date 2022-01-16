import { generateReportFromQueryData } from './utilities';
const query = `
select 
case when diagnosis_date is null then 
case when sr_date is null then snap_date else sr_date end
  else diagnosis_date end as date,
      count(distinct(patient.id)) as unique_patients_with_encounters,
      count(cvd_response_table.sr_date) as number_of_cvd_screenings,
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
WHERE rd.code in ('icd10-I10')
) hypertension_temp on diagnosis_encounter.id = hypertension_temp.encounter_id
) diagnosis_table
on diagnosis_table.patient_id = patient.id and diagnosis_table.diagnosis_date = cvd_response_table.sr_date
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
on snap_counselling_table.patient_id = patient.id and snap_counselling_table.snap_date = cvd_response_table.sr_date
group by date order by date desc;
  `;

const attempt_2 = `

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
