import { groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from '../../utilities';
import { transformAnswers } from '../../utilities/transformAnswers';

const INITIAL_SURVEY_ID = 'program-palaucovid19-palaucovidinitialcasereportform';
const FOLLOW_UP_SURVEY_ID = 'program-palaucovid19-palaucovidfollowupcasereport';

const reportColumnTemplate = [
  { title: 'Patient first name', accessor: data => data.patient.firstName },
  { title: 'Patient last name', accessor: data => data.patient.lastName },
  { title: 'DOB', accessor: data => data.patient.dateOfBirth },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Patient ID', accessor: data => data.patient.displayId },
  { title: 'Hamlet', accessor: data => data.patient.village?.name },
  { title: 'Nationality', accessor: data => data.patient.additionalData?.[0]?.nationality?.name },

  // initial survey
  // instruction case investigator
  { title: 'Name', accessor: data => data['pde-PalauCOVCase2'] },
  { title: 'Case report date', accessor: data => data['pde-PalauCOVCase3'] },
  { title: 'Interview date', accessor: data => data['pde-PalauCOVCase4'] },
  // instruction case identification
  { title: 'Passport number', accessor: data => data['pde-PalauCOVCase6'] },
  { title: 'Phone number', accessor: data => data['pde-PalauCOVCase7'] },
  { title: 'Current street address', accessor: data => data['pde-PalauCOVCase8'] },
  { title: 'City/Hamlet', accessor: data => data['pde-PalauCOVCase9'] },
  { title: 'Is the patient a healthcare worker?', accessor: data => data['pde-PalauCOVCase10'] },
  {
    title: 'If yes, indicate facility',
    accessor: data => data['pde-PalauCOVCase11'],
  },
  { title: 'Full name (Respondant)', accessor: data => data['pde-PalauCOVCase13'] },
  { title: 'Relationship to case (Respondant)', accessor: data => data['pde-PalauCOVCase14'] },
  {
    title: 'Hospitalization required for COVID-19',
    accessor: data => data['pde-PalauCOVCase16'],
  },
  { title: 'Vaccination status', accessor: data => data['pde-PalauCOVCase18'] },
  { title: 'Booster/third dose date', accessor: data => data['pde-PalauCOVCase20'] },
  {
    title: 'Has the patient been exposed out of Palau in the last 14 days?',
    accessor: data => data['pde-PalauCOVCase27'],
  },
  { title: 'If yes, list date of arrival in Palau', accessor: data => data['pde-PalauCOVCase28'] },
  { title: 'Risk factors', accessor: data => data['pde-PalauCOVCase31'] },
  // instruction high risk
  // instruction lab testing
  { title: 'Day 0 sample collected', accessor: data => data['pde-PalauCOVCase33'] },
  { title: 'Is the patient symptomatic?', accessor: data => data['pde-PalauCOVCase36'] },

  // follow up survey
  { title: 'Follow up sample collected', accessor: data => data['pde-PalauCOVCaseFUp02'] },
  { title: 'Symptomatic', accessor: data => data['pde-PalauCOVCaseFUp04'] },
  { title: 'Patient outcome', accessor: data => data['pde-PalauCOVCaseFUp06'] },
  { title: 'Date symptoms resolved', accessor: data => data['pde-PalauCOVCaseFUp07'] },
  { title: 'Date of death', accessor: data => data['pde-PalauCOVCaseFUp08'] },
];

const WILLIAM_HOROTO_IDS = [
  'f4a0e3f0-54da-4fc9-a73e-1b72c9ca92a5', // Kiribati
  '4d719b6f-af55-42ac-99b3-5a27cadaab2b', // Palau
  '2d574680-e0fc-4956-a37e-121ccb434995', // Fiji
  'cebdd9a4-2744-4ad2-9919-98dc0b15464c', // Dev - for testing purposes
];

const parametersToSurveyResponseSqlWhere = (parameters, surveyId) => {
  const defaultWhereClause = {
    surveyId,
    '$encounter->patient.id$': {
      [Op.notIn]: WILLIAM_HOROTO_IDS,
    },
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      switch (key) {
        case 'village':
          where['$encounter->patient.village_id$'] = value;
          break;
        case 'fromDate':
          if (!where.endTime) {
            where.endTime = {};
          }
          where.endTime[Op.gte] = value;
          break;
        case 'toDate':
          if (!where.endTime) {
            where.endTime = {};
          }
          where.endTime[Op.lte] = value;
          break;
        default:
          break;
      }
      return where;
    }, defaultWhereClause);

  return whereClause;
};

const getLatestSurveyResponses = async (models, parameters, surveyId) => {
  return await models.SurveyResponse.findAll({
    where: parametersToSurveyResponseSqlWhere(parameters, surveyId),
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: [
          {
            model: models.Patient,
            as: 'patient',
            include: [
              {
                model: models.PatientAdditionalData,
                as: 'additionalData',
                include: ['ethnicity', 'nationality'],
              },
              'village',
            ],
          },
        ],
      },
      {
        model: models.SurveyResponseAnswer,
        as: 'answers',
      },
    ],
    order: [['end_time', 'DESC']],
  });
};

export const dataGenerator = async ({ models }, parameters = {}) => {
  const initialSurveyResponses = await getLatestSurveyResponses(
    models,
    parameters,
    INITIAL_SURVEY_ID,
  );

  const initialSurveyResponsesByPatient = groupBy(
    initialSurveyResponses,
    r => r.encounter.patientId,
  );

  const initialSurveyComponents = await models.SurveyScreenComponent.getComponentsForSurvey(
    INITIAL_SURVEY_ID,
  );

  const followUpSurveyComponents = await models.SurveyScreenComponent.getComponentsForSurvey(
    FOLLOW_UP_SURVEY_ID,
  );

  const followupSurveyResponses = await getLatestSurveyResponses(
    models,
    parameters,
    FOLLOW_UP_SURVEY_ID,
  );

  const followUpSurveyResponsesByPatient = groupBy(
    followupSurveyResponses,
    r => r.encounter.patientId,
  );

  const transformedSurveyResponses = await Promise.all(
    Object.entries(initialSurveyResponsesByPatient)
      .map(([patientId, patientSurveyResponses]) => {
        // create a row for each initial survey response
        return patientSurveyResponses.map((surveyResponse, index) => {
          // find the corresponding follow up survey for each initial survey 

          // only select follow up surveys after the current initial survey
          const followUpSurveyResponseFromDate = moment(surveyResponse.endTime).startOf('day');
          // only select follow up survey before current time for latest initial survey
          // if there are more than 1 initial surveys (index > 0)
          // only select follow up survey before the later initial survey
          const followUpSurveyResponseBeforeTime =
            index === 0
              ? moment()
              : moment(patientSurveyResponses[index - 1].endTime);
          const followUpSurvey = followUpSurveyResponsesByPatient[
            patientId
          ]?.find(followUpSurveyResponse =>
            moment(followUpSurveyResponse.endTime).isBetween(
              followUpSurveyResponseFromDate,
              followUpSurveyResponseBeforeTime,
              undefined,
              '[)', // from inclusive, end exclusive
            ),
          );
          async function transform() {
            const resultResponse = surveyResponse;
            resultResponse.initialSurveyResponseAnswers = await transformAnswers(
              models,
              surveyResponse.answers.map(a => {
                a.surveyResponse = surveyResponse;
                return a;
              }),
              initialSurveyComponents,
              {
                dateFormat: 'DD-MM-YYYY',
              },
            );
            if (followUpSurvey) {
              resultResponse.followUpSurveyResponseAnswers = await transformAnswers(
                models,
                followUpSurvey.answers.map(a => {
                  a.surveyResponse = followUpSurvey;
                  return a;
                }),
                followUpSurveyComponents,
                {
                  dateFormat: 'DD-MM-YYYY',
                },
              );
            }

            return resultResponse;
          }
          return transform();
        });
      })
      .flat(),
  );

  const reportData = transformedSurveyResponses.map(row => {
    const rowData = { patient: row.encounter.patient };
    row.initialSurveyResponseAnswers.reduce((acc, answer) => {
      acc[answer.dataElementId] = answer.body;
      return acc;
    }, rowData);
    if (row.followUpSurveyResponseAnswers) {
      row.followUpSurveyResponseAnswers.reduce((acc, answer) => {
        acc[answer.dataElementId] = answer.body;
        return acc;
      }, rowData);
    }
    return rowData;
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'SurveyResponse';
