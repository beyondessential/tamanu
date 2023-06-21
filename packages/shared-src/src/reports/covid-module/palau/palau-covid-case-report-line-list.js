/* eslint-disable import/no-unresolved, import/extensions */

import { subDays, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { groupBy } from 'lodash';
import { Op } from 'sequelize';

import { ageInYears, format, toDateTimeString } from '../../../utils/dateTime';
import { generateReportFromQueryData } from '../../utilities';
import { transformAnswers } from '../../utilities/transformAnswers';

const INITIAL_SURVEY_ID = 'program-palaucovid19-palaucovidinitialcasereportform';
const FOLLOW_UP_SURVEY_ID = 'program-palaucovid19-palaucovidfollowupcasereport';

const reportColumnTemplate = [
  { title: 'Case ID', accessor: data => data['pde-PalauCOVCase6'] },
  { title: 'Case investigator', accessor: data => data['pde-PalauCOVCase2'] },
  { title: 'Case investigator (If other)', accessor: data => data['pde-PalauCOVCase2a'] },
  { title: 'EpiWeek', accessor: data => data['pde-PalauCOVCase33'] },
  { title: 'Case report date', accessor: data => data['pde-PalauCOVCase3'] },
  { title: 'Interview date', accessor: data => data['pde-PalauCOVCase4'] },
  { title: 'Hospital No.', accessor: data => data.patient.displayId },
  { title: 'Passport number', accessor: data => data['pde-PalauCOVCase6'] },
  { title: 'Last name', accessor: data => data.patient.lastName },
  { title: 'First name', accessor: data => data.patient.firstName },
  { title: 'Middle name', accessor: data => data.patient.middleName },
  { title: 'DOB', accessor: data => format(data.patient.dateOfBirth, 'yyyy/MM/dd') },
  {
    title: 'Age',
    accessor: data => {
      return data.patient.dateOfBirth ? ageInYears(data.patient.dateOfBirth) : '';
    },
  },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Nationality', accessor: data => data['pde-PalauCOVCase6a'] },
  { title: 'Street address', accessor: data => data['pde-PalauCOVCase8'] },
  { title: 'City/Hamlet', accessor: data => data['pde-PalauCOVCase9'] },
  { title: 'State', accessor: data => data['pde-PalauCOVCase9a'] },
  { title: 'Phone number 1', accessor: data => data['pde-PalauCOVCase7'] },
  { title: 'Phone number 2', accessor: data => data['pde-PalauCOVCase7a'] },
  { title: 'Healthcare worker', accessor: data => data['pde-PalauCOVCase10'] },
  {
    title: 'If HCW, specify HCF',
    accessor: data => data['pde-PalauCOVCase11'],
  },
  { title: 'Respondant name', accessor: data => data['pde-PalauCOVCase13'] },
  { title: 'Respondant relationship to case', accessor: data => data['pde-PalauCOVCase14'] },
  {
    title: 'Hospitalization required',
    accessor: data => data['pde-PalauCOVCase16'],
  },
  { title: 'Vaccination status', accessor: data => data['pde-PalauCOVCase18'] },
  { title: 'Booster/third dose date', accessor: data => data['pde-PalauCOVCase20'] },
  {
    title: 'Has the case traveled in the past 14 days',
    accessor: data => data['pde-PalauCOVCase27'],
  },
  { title: 'Arrival date in Palau', accessor: data => data['pde-PalauCOVCase28'] },
  { title: 'Risk factors', accessor: data => data['pde-PalauCOVCase31'] },
  { title: 'Day 0 sample collected', accessor: data => data['pde-PalauCOVCase33'] },
  { title: 'Symptomatic on day 0', accessor: data => data['pde-PalauCOVCase36'] },
  { title: 'Reinfection', accessor: data => data['pde-PalauCOVCase37'] },

  // follow up survey
  { title: 'Day 5 sample collected', accessor: data => data['pde-PalauCOVCaseFUp02'] },
  { title: 'Symptomatic on day 5', accessor: data => data['pde-PalauCOVCaseFUp04'] },
  { title: 'Patient outcome', accessor: data => data['pde-PalauCOVCaseFUp06'] },
  { title: 'If recovered, date', accessor: data => data['pde-PalauCOVCaseFUp07'] },
  { title: 'If dead, date', accessor: data => data['pde-PalauCOVCaseFUp08'] },
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

  const newParameters = {
    ...parameters,
    fromDate: toDateTimeString(
      startOfDay(parameters.fromDate ? parseISO(parameters.fromDate) : subDays(new Date(), 30)),
    ),
  };

  if (newParameters.toDate) {
    newParameters.toDate = toDateTimeString(endOfDay(parseISO(newParameters.toDate)));
  }

  /* eslint-disable no-param-reassign */
  const whereClause = Object.entries(newParameters)
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
  /* eslint-enable no-param-reassign */

  return whereClause;
};

const getSurveyResponses = async (models, parameters, surveyId) => {
  return models.SurveyResponse.findAll({
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
  const initialSurveyResponses = await getSurveyResponses(models, parameters, INITIAL_SURVEY_ID);

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

  const followupSurveyResponses = await getSurveyResponses(models, parameters, FOLLOW_UP_SURVEY_ID);

  const followUpSurveyResponsesByPatient = groupBy(
    followupSurveyResponses,
    r => r.encounter.patientId,
  );

  const transformedSurveyResponses = await Promise.all(
    Object.entries(initialSurveyResponsesByPatient).map(([patientId, patientSurveyResponses]) => {
      // only take the latest initial survey response
      const surveyResponse = patientSurveyResponses[0];
      // only select follow up surveys after the current initial survey
      const followUpSurveyResponseFromDate = startOfDay(parseISO(surveyResponse.endTime));
      const followUpSurvey = followUpSurveyResponsesByPatient[patientId]?.find(
        followUpSurveyResponse =>
          !isBefore(parseISO(followUpSurveyResponse.endTime), followUpSurveyResponseFromDate),
      );
      async function transform() {
        const resultResponse = surveyResponse;
        resultResponse.initialSurveyResponseAnswers = await transformAnswers(
          models,
          surveyResponse.answers.map(a => {
            // eslint-disable-next-line no-param-reassign
            a.surveyResponse = surveyResponse;
            return a;
          }),
          initialSurveyComponents,
          {
            dateFormat: 'yyyy/MM/dd',
          },
        );
        if (followUpSurvey) {
          resultResponse.followUpSurveyResponseAnswers = await transformAnswers(
            models,
            followUpSurvey.answers.map(a => {
              // eslint-disable-next-line no-param-reassign
              a.surveyResponse = followUpSurvey;
              return a;
            }),
            followUpSurveyComponents,
            {
              dateFormat: 'yyyy/MM/dd',
            },
          );
        }

        return resultResponse;
      }
      return transform();
    }),
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
