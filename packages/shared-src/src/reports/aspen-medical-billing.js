import { Sequelize, Op } from 'sequelize';
import moment from 'moment';
import { groupBy, keyBy } from 'lodash';
import { generateReportFromQueryData } from '../utilities';

const REFERRAL_SCREENING_FORM_MAPPING = {
  'program-fijincdprimaryscreening-fijicvdprimaryscreen2':
    'program-fijincdprimaryscreening-fijicvdprimaryscreenref',
  'program-fijincdprimaryscreening-fijibreastprimaryscreen':
    'program-fijincdprimaryscreening-fijibreastscreenref',
  'program-fijincdprimaryscreening-fijicervicalprimaryscreen':
    'program-fijincdprimaryscreening-fijicervicalscreenref',
};

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

const FIELDS = {
  date: { title: 'Date' },
  patientsScreened: {
    title: 'Total individuals screened',
  },
  screened: {
    title: 'Total screening events',
    selectSql: 'true',
  },
  screenedMale: {
    title: 'Total screening events by male',
    selectSql: "patient.sex = 'male'",
  },
  screenedFemale: {
    title: 'Total screening events by female',
    selectSql: "patient.sex = 'female'",
  },
  'screened<30': {
    title: 'Total screening events by <30 years',
    selectSql: 'extract(year from age(patient.date_of_birth)) < 30',
  },
  'screened>30': {
    title: 'Total screening events by >30 years',
    selectSql: 'extract(year from age(patient.date_of_birth)) >= 30',
  },
  screenedItaukei: {
    title: 'Total screening events by Itaukei',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.ITAUKEI}'`,
  },
  screenedIndian: {
    title: 'Total screening events by Fijian of Indian descent',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.INDIAN}'`,
  },
  screenedOther: {
    title: 'Total screening events by other ethnicity',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.OTHERS}'`,
  },
  'screenedRisk<10': {
    title: 'Total screening events by CVD risk <10%',
    selectSql: "(sr.result_text like '%GREEN%')",
  },
  'screenedRisk10-20': {
    title: 'Total screening events by CVD risk 10% to <20%',
    selectSql: "(sr.result_text like '%YELLOW%')",
  },
  'screenedRisk20-30': {
    title: 'Total screening events by CVD risk 20% to <30%',
    selectSql: "(sr.result_text like '%ORANGE%')",
  },
  'screenedRisk30-40': {
    title: 'Total screening events by CVD risk 30% to <40%',
    selectSql: "(sr.result_text like '%RED%')",
  },
  'screenedRisk>40': {
    title: 'Total screening events by CVD risk ≥40%',
    selectSql: "(sr.result_text like '%PURPLE%')",
  },
  // Use % on both sides to strip off potential whitespace
  screenedHighBreastCancerRisk: {
    title: 'Total screening events by high risk of breast cancer',
    selectSql: "(sr.result_text like '%High risk%')",
  },
  referredNumber: {
    title: 'Total referred',
    selectSql: 'referral_sr.id is not null',
  },
  referredMale: {
    title: 'Total referred by male',
    selectSql: "referral_sr.id is not null and patient.sex = 'male'",
  },
  referredFemale: {
    title: 'Total referred by female',
    selectSql: "referral_sr.id is not null and patient.sex = 'female'",
  },
  'referred<30': {
    title: 'Total referred by <30 years',
    selectSql: 'referral_sr.id is not null and extract(year from age(patient.date_of_birth)) < 30',
  },
  'referred>30': {
    title: 'Total referred by >30 years',
    selectSql: 'referral_sr.id is not null and extract(year from age(patient.date_of_birth)) >= 30',
  },
  referredItaukei: {
    title: 'Total referred by Itaukei',
    selectSql: `referral_sr.id is not null and additional_data.ethnicity_id = '${ETHNICITY_IDS.ITAUKEI}'`,
  },
  referredIndian: {
    title: 'Total referred by Fijian of Indian descent',
    selectSql: `referral_sr.id is not null and additional_data.ethnicity_id = '${ETHNICITY_IDS.INDIAN}'`,
  },
  referredOther: {
    title: 'Total referred by other ethnicity',
    selectSql: `referral_sr.id is not null and additional_data.ethnicity_id = '${ETHNICITY_IDS.OTHERS}'`,
  },
};
const hi = `
with 
	patients_considered as (
		select id, 
	display_id,
	first_name,
	last_name,
	date_of_birth from patients
		where last_name = 'Lane'
	),
	lab_test_joiner as (
		select lab_request_id, string_agg(ltt.name, ',') as lab_test_names
		from lab_tests lt
		join lab_test_types ltt 
		on ltt.id = lt.lab_test_type_id
		group by lab_request_id
	),
	lab_request_info as (
		select
			null as hack,
			encounter_id,
			'labRequest' as type,
			display_id,
			category.name as category,
			urgent,
			status,
			priority.name as priority,
			lab_test_names
	from lab_requests lr
		left join lab_test_joiner ltj on ltj.lab_request_id = lr.id
		left join reference_data category ON category.id = lr.lab_test_category_id
		left join reference_data priority  ON priority.id = lr.lab_test_priority_id 
	),
	vaccine_info as (
		select
			null as hack,
			encounter_id,
			'vaccine' as type,
			status,
			date,
			category,
			label,
			schedule
		from administered_vaccines av 
		left join scheduled_vaccines sv ON sv.id = av.scheduled_vaccine_id
	),
	medications_info as (
		select
			null as hack,
			encounter_id,
			'medication' as type,
			prescription,
			note,
			indication,
			medication.name,
			quantity,
			discontinued,
			repeats,
			is_discharge
		from encounter_medications em
		join reference_data medication on medication.id = em.medication_id 
	),
	diagnosis_info as (
		select
			null as hack,
			encounter_id,
			'diagnosis' as type,
			diagnosis.name,
			certainty,
			is_primary,
			date
		from encounter_diagnoses ed
		join reference_data diagnosis on diagnosis.id = ed.diagnosis_id  
	),
	data_per_encounter as (
		select 
			coalesce(lri.encounter_id, vi.encounter_id, mi.encounter_id, di.encounter_id) as abc,
			coalesce(lri.type, vi.type, mi.type, di.type) as line_type,
			*
		from lab_request_info lri
		full outer join vaccine_info vi on lri.hack = vi.hack
		full outer join medications_info mi on lri.hack = mi.hack
		full outer join diagnosis_info di on lri.hack = di.hack
	)
select 
	p.*,
	e.start_date,
	e.reason_for_encounter,
	e.encounter_type,
	dpe.*
from patients_considered p
join encounters e on e.patient_id = p.id
join data_per_encounter dpe on dpe.abc = e.id
order by patient_id;
   
`;
const reportColumnTemplate = Object.entries(FIELDS).map(([key, { title }]) => ({
  title,
  accessor: data => data[key],
}));

function sumObjectsByKey(objs) {
  return objs.reduce((a, b) => {
    for (const k of Object.keys(b)) {
      a[k] = (parseInt(a[k], 10) || 0) + parseInt(b[k], 10);
    }
    return a;
  }, {});
}

const parametersToSqlWhereClause = parameterKeys => {
  return parameterKeys
    .map(key => {
      switch (key) {
        case 'village':
          return 'AND patient.village_id = :village_id';
        case 'medicalArea':
          return 'AND additional_data.medical_area_id = :medical_area_id';
        case 'nursingZone':
          return 'AND additional_data.nursing_zone_id = :nursing_zone_id';
        case 'division':
          return 'AND additional_data.division_id = :division_id';
        case 'fromDate':
          return 'AND sr.end_time > :from_date';
        case 'toDate':
          // Cast to date (no time) so we select any surveys on or before the calendar day provided
          return 'AND sr.end_time::date <= :to_date::date';
        default:
          break;
      }
    })
    .join('\n');
};

const getData = async (sequelize, parameters) => {
  const nonEmptyParameterKeys = Object.entries(parameters)
    .filter(([key, val]) => !!val)
    .map(([key, val]) => key);

  const {
    fromDate,
    toDate,
    village,
    medicalArea,
    nursingZone,
    division,
    surveyIds = Object.keys(REFERRAL_SCREENING_FORM_MAPPING).join(', '),
  } = parameters;

  let results = [];
  for (const surveyId of surveyIds.split(', ')) {
    const resultsForSurvey = await sequelize.query(
      `
        SELECT * from patients;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          screening_survey_id: surveyId,
          referral_survey_id: REFERRAL_SCREENING_FORM_MAPPING[surveyId],
          from_date: fromDate,
          to_date: toDate,
          village_id: village,
          medical_area_id: medicalArea,
          nursing_zone_id: nursingZone,
          division_id: division,
        },
      },
    );
    results = results.concat(resultsForSurvey);
  }
  return results;
};

const getTotalPatientsScreened = async (sequelize, parameters) => {
  const nonEmptyParameterKeys = Object.entries(parameters)
    .filter(([key, val]) => !!val)
    .map(([key, val]) => key);

  const {
    fromDate,
    toDate,
    village,
    medicalArea,
    nursingZone,
    division,
    surveyIds = Object.keys(REFERRAL_SCREENING_FORM_MAPPING).join(', '),
  } = parameters;

  return sequelize.query(
    `
      SELECT 
        to_char(sr.end_time, 'yyyy-mm-dd') as date,
        count(DISTINCT patient.id) as "patientsScreened"
      FROM survey_responses AS sr 
        ${getJoinClauses()}
      WHERE sr.survey_id IN (:screening_survey_ids)
      AND (eligibilityAnswer.body != 'Ineligible' or eligibilityAnswer.body is null)
        ${parametersToSqlWhereClause(nonEmptyParameterKeys)}
      GROUP BY date
      ORDER BY date desc;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        screening_survey_ids: surveyIds.split(', '),
        referral_survey_id: null,
        from_date: fromDate,
        to_date: toDate,
        village_id: village,
        medical_area_id: medicalArea,
        nursing_zone_id: nursingZone,
        division_id: division,
      },
    },
  );
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const patientsScreenedData = await getTotalPatientsScreened(sequelize, parameters);
  const patientsScreenedByDate = keyBy(patientsScreenedData, 'date');
  const results = await getData(sequelize, parameters);

  const reportData = Object.entries(groupBy(results, 'date'))
    .map(([date, resultsForDate]) => ({
      date,
      patientsScreened: parseInt(patientsScreenedByDate[date].patientsScreened, 10),
      ...sumObjectsByKey(resultsForDate.map(({ date: _, ...summableKeys }) => summableKeys)),
    }))
    // Sort oldest to most recent
    .sort(({ date: date1 }, { date: date2 }) => moment(date1) - moment(date2))
    .map(({ date, ...otherFields }) => ({
      date: moment(date).format('DD-MM-YYYY'),
      ...otherFields,
    }));

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
