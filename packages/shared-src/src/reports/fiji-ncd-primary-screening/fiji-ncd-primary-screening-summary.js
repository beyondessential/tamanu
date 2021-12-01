import { Sequelize, Op } from 'sequelize';
import moment from 'moment';
import { groupBy } from 'lodash';
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
  screened: {
    title: 'Total screened',
    selectSql: 'true',
  },
  screenedMale: {
    title: 'Total screened by male',
    selectSql: "patient.sex = 'male'",
  },
  screenedFemale: {
    title: 'Total screened by female',
    selectSql: "patient.sex = 'female'",
  },
  'screened<30': {
    title: 'Total screened by <30 years',
    selectSql: 'extract(year from age(patient.date_of_birth)) < 30',
  },
  'screened>30': {
    title: 'Total screened by >30 years',
    selectSql: 'extract(year from age(patient.date_of_birth)) >= 30',
  },
  screenedItaukei: {
    title: 'Total screened by Itaukei',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.ITAUKEI}'`,
  },
  screenedIndian: {
    title: 'Total screened by Fijian of Indian descent',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.INDIAN}'`,
  },
  screenedOther: {
    title: 'Total screened by other ethnicity',
    selectSql: `additional_data.ethnicity_id = '${ETHNICITY_IDS.OTHERS}'`,
  },
  'screenedRisk<5': {
    title: 'Total screened by CVD risk <5% (%)',
    selectSql: "(sr.result_text like '%GREEN%')",
  },
  'screenedRisk5-10': {
    title: 'Total screened by CVD risk 5% to <10% (%)',
    selectSql: "(sr.result_text like '%YELLOW%')",
  },
  'screenedRisk10-20': {
    title: 'Total screened by CVD risk 10% to <20% (%)',
    selectSql: "(sr.result_text like '%ORANGE%')",
  },
  'screenedRisk20-30': {
    title: 'Total screened by CVD risk 20% to <30% (%)',
    selectSql: "(sr.result_text like '%RED%')",
  },
  'screenedRisk>30': {
    title: 'Total screened by CVD risk ≥30% (%)',
    selectSql: "(sr.result_text like '%PURPLE%')",
  },
  referredPercent: {
    title: 'Total referred (%)',
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

const buildCase = (name, condition) => `count(case when ${condition} then 1 end) as "${name}"`;

const getSelectClause = () => {
  return `
    to_char(sr.end_time, 'yyyy-mm-dd') as date,
    ${Object.entries(FIELDS)
      .filter(([_, { selectSql }]) => selectSql)
      .map(([key, { selectSql }]) => buildCase(key, selectSql))
      .join(',\n')}
  `;
};

const getJoinClauses = () => {
  // interval '24 hours' is a postgres specific construct. (question for pr: do we still want to support other dbs?)
  /**
   * Referral must be:
   *  - 0-24 hours after the survey_response
   *  - for the same patient
   */
  const referralJoinClause = `
    LEFT JOIN survey_responses AS referral_sr ON 
      referral_sr.id = (
        SELECT sr2.id FROM survey_responses sr2
        JOIN surveys s2 ON s2.id = sr2.survey_id 
        JOIN encounters e2 ON e2.id = sr2.encounter_id
        WHERE e2.patient_id = patient.id
        AND sr2.survey_id = :referral_survey_id
        AND sr.end_time < sr2.end_time
        AND sr2.end_time < sr.end_time + interval '24 hours'
        LIMIT 1
      )
  `;
  return `
    JOIN encounters AS sr_encounter ON sr.encounter_id = sr_encounter.id 
    JOIN patients AS patient ON sr_encounter.patient_id = patient.id
    LEFT JOIN patient_additional_data AS additional_data
    ON additional_data.id = (
        SELECT id FROM patient_additional_data 
        WHERE patient_id = patient.id
        LIMIT 1
      )
    ${referralJoinClause}
  `;
};

const getData = async (sequelize, parameters) => {
  const nonEmptyParameterKeys = Object.entries(parameters)
    .filter(([key, val]) => !!val)
    .map(([key, val]) => key);

  const {
    fromDate,
    toDate,
    village,
    division,
    surveyIds = Object.keys(REFERRAL_SCREENING_FORM_MAPPING).join(', '),
  } = parameters;

  let results = [];
  for (const surveyId of surveyIds.split(', ')) {
    const resultsForSurvey = await sequelize.query(
      `
        SELECT 
          ${getSelectClause()}
        FROM survey_responses AS sr 
          ${getJoinClauses()}
        WHERE sr.survey_id = :screening_survey_id
          ${parametersToSqlWhereClause(nonEmptyParameterKeys)}
        GROUP BY date
        ORDER BY date desc;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          screening_survey_id: surveyId,
          referral_survey_id: REFERRAL_SCREENING_FORM_MAPPING[surveyId],
          from_date: fromDate,
          to_date: toDate,
          village_id: village,
          division_id: division,
        },
      },
    );
    results = results.concat(resultsForSurvey);
  }
  return results;
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  const reportData = Object.entries(groupBy(results, 'date'))
    .map(([date, resultsForDate]) => ({
      date,
      ...sumObjectsByKey(resultsForDate.map(({ date: _, ...summableKeys }) => summableKeys)),
    }))
    .sort(({ date: date1 }, { date: date2 }) => moment(date2) - moment(date1));

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
