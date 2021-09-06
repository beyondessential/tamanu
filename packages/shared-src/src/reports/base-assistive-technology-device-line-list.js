import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';
import { transformAnswers } from './utilities/transformAnswers';

const parametersToSurveyResponseSqlWhere = (parameters, surveyIds) => {
  const defaultWhereClause = {
    '$surveyResponse.survey_id$': surveyIds,
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'fromDate':
          if (!newWhere['$surveyResponse.end_time$']) {
            newWhere['$surveyResponse.end_time$'] = {};
          }
          newWhere['$surveyResponse.end_time$'][Op.gte] = value;
          break;
        case 'toDate':
          if (!newWhere['$surveyResponse.end_time$']) {
            newWhere['$surveyResponse.end_time$'] = {};
          }
          newWhere['$surveyResponse.end_time$'][Op.lte] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const getAnswers = async (models, parameters, surveyIds) => {
  return models.SurveyResponseAnswer.findAll({
    where: {
      ...parametersToSurveyResponseSqlWhere(parameters, surveyIds),
      body: {
        [Op.not]: '',
      },
    },
    include: [
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            include: [
              {
                model: models.Patient,
                as: 'patient',
              },
            ],
          },
        ],
      },
    ],
    order: [[{ model: models.SurveyResponse, as: 'surveyResponse' }, 'end_time', 'ASC']],
  });
};

const getPerPatientPerDateAnswerKey = (patientId, dataElementId, responseDate) =>
  `${patientId}|${dataElementId}|${responseDate}`;

const getPerPatientAnswerKey = (patientId, dataElementId) => `${patientId}|${dataElementId}`;

const getLatestAnswerPerGroup = groupedTransformAnswers => {
  const results = {};
  for (const [key, groupedAnswers] of Object.entries(groupedTransformAnswers)) {
    const sortedLatestToOldestAnswers = groupedAnswers.sort((a1, a2) =>
      moment(a2.responseEndTime).diff(moment(a1.responseEndTime)),
    );
    results[key] = sortedLatestToOldestAnswers[0]?.body;
  }
  return results;
};

const getLatestAnswerPerPatient = answers => {
  const groupedAnswers = groupBy(answers, a =>
    getPerPatientAnswerKey(a.patientId, a.dataElementId),
  );
  return getLatestAnswerPerGroup(groupedAnswers);
};

const getLatestAnswerPerPatientPerDate = answers => {
  const groupedAnswers = groupBy(answers, a => {
    const responseDate = moment(a.responseEndTime).format('DD-MM-YYYY');
    return getPerPatientPerDateAnswerKey(a.patientId, a.dataElementId, responseDate);
  });
  return getLatestAnswerPerGroup(groupedAnswers);
};

export const dataGenerator = async (
  models,
  parameters = {},
  surveyIds,
  surveyDataElementIdsLatestPerPatient,
  surveyDataElementIdsLatestPerPatientPerDate,
  reportColumnTemplate,
) => {
  const answers = await getAnswers(models, parameters, surveyIds);
  const components = await models.SurveyScreenComponent.getComponentsForSurveys(surveyIds);
  const transformedAnswers = await transformAnswers(models, answers, components);
  const answersForPerPatient = transformedAnswers.filter(a =>
    Object.values(surveyDataElementIdsLatestPerPatient).includes(a.dataElementId),
  );
  const answersForPerPatientPerDate = transformedAnswers.filter(a =>
    Object.values(surveyDataElementIdsLatestPerPatientPerDate).includes(a.dataElementId),
  );
  const latestAnswersPerPatient = getLatestAnswerPerPatient(answersForPerPatient);
  const latestAnswersPerPatientPerDate = getLatestAnswerPerPatientPerDate(
    answersForPerPatientPerDate,
  );
  const patients = answers.map(a => a.surveyResponse?.encounter?.patient);
  const patientById = keyBy(patients, 'id');
  const surveyResponseDates = [
    ...new Set(
      answersForPerPatientPerDate.map(a => moment(a.responseEndTime).format('DD-MM-YYYY')),
    ),
  ];
  const reportData = [];

  for (const surveyResponseDate of surveyResponseDates) {
    for (const [patientId, patient] of Object.entries(patientById)) {
      const dateOfBirth = patient.dateOfBirth
        ? moment(patient.dateOfBirth).format('DD-MM-YYYY')
        : '';
      const age = dateOfBirth ? moment().diff(dateOfBirth, 'years') : '';
      const recordData = {
        clientId: patient.displayId,
        gender: patient.sex,
        dateOfBirth: dateOfBirth,
        age: age,
      };

      // Get the answers for data elements that we need to show latest PER PATIENT
      Object.entries(surveyDataElementIdsLatestPerPatient).forEach(([key, dataElementId]) => {
        recordData[key] =
          latestAnswersPerPatient[
            getPerPatientAnswerKey(patientId, dataElementId, surveyResponseDate)
          ];
      });

      // Get the answers for data elements that we need to show latest PER PATIENT PER DATE
      Object.entries(surveyDataElementIdsLatestPerPatientPerDate).forEach(
        ([key, dataElementId]) => {
          recordData[key] =
            latestAnswersPerPatientPerDate[
              getPerPatientPerDateAnswerKey(patientId, dataElementId, surveyResponseDate)
            ];
        },
      );

      reportData.push(recordData);
    }
  }

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
