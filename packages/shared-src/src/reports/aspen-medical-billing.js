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
	billing_type as (
		select 
			patient_id,
			max(rd.name) "Patient billing type"
		from patient_additional_data adc
		join reference_data rd on rd.id = patient_billing_type_id
		group by patient_id 
	),
	patients_considered as (
		select
			id, 
			display_id,
			first_name,
			last_name,
			date_of_birth,
			sex 
		from patients
	),
	lab_request_info as (
		select 
			encounter_id,
			string_agg(ltt.name, ';') as "Lab requests"
		from lab_requests lr
		join lab_tests lt on lt.lab_request_id = lr.id
		join lab_test_types ltt 
		on ltt.id = lt.lab_test_type_id
		group by encounter_id
	),
	procedure_info as (
		select
			encounter_id,
			string_agg(proc.name || ', ' || proc.code, ';') as "Procedures"
		from "procedures" p2 
		left join reference_data proc ON proc.id = p2.procedure_type_id
		group by encounter_id 
	),
	medications_info as (
		select
			encounter_id,
			string_agg(medication.name, ';') as "Medications"
		from encounter_medications em
		join reference_data medication on medication.id = em.medication_id
		group by encounter_id
	),
	diagnosis_info as (
		select
			encounter_id,
			string_agg(diagnosis.name || ', ' || diagnosis.code || ', primary:' || is_primary || ', ' || certainty, ';') as "Diagnosis"
		from encounter_diagnoses ed
		join reference_data diagnosis on diagnosis.id = ed.diagnosis_id
		group by encounter_id
	),
	imaging_info as (
		select
			encounter_id,
			string_agg(image_type.name, ';') as "Imaging requests"
		from imaging_requests ir
		join reference_data image_type on image_type.id = ir.imaging_type_id 
		group by encounter_id
	),
	notes_info as (
		select
			record_id as encounter_id,
			string_agg(n.note_type || ': ' || n."content" , ';') as "Notes"
		from notes n
		group by record_id
	)
select
	p.display_id "NHN",
	p.first_name "First name",
	p.last_name "Last name",
	p.date_of_birth "Date of birth",
	p.sex "Sex",
	bt."Patient billing type",
	to_char(e.start_date, 'YYYY-MM-DD HH24:MI') "Encounter start date",
	to_char(e.end_date, 'YYYY-MM-DD HH24:MI') "Encounter end date",
	e.encounter_type "Encounter type",
	e.reason_for_encounter "Reason for encounter",
	di."Diagnosis",
	mi."Medications",
	pi."Procedures",
	lri."Lab requests",
	ii."Imaging requests",
	ni."Notes"
from patients_considered p
join encounters e on e.patient_id = p.id
left join billing_type bt on bt.patient_id = p.id
left join medications_info mi on e.id = mi.encounter_id
left join diagnosis_info di on e.id = di.encounter_id
left join procedure_info pi on e.id = pi.encounter_id
left join lab_request_info lri on lri.encounter_id = e.id
left join imaging_info ii on ii.encounter_id = e.id
left join notes_info ni on ni.encounter_id = e.id
order by e.start_date;
   
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
