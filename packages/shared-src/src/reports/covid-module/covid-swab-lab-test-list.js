import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from '../utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../../constants';
import { transformAnswers } from '../utilities/transformAnswers';

const yieldControl = () => new Promise(resolve => setTimeout(resolve, 20));

const parametersToLabTestSqlWhere = parameters => {
  const defaultWhereClause = {
    '$labRequest.lab_test_category_id$': 'labTestCategory-COVID',
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$labRequest->encounter->patient.village_id$'] = value;
          break;
        case 'labTestLaboratory':
          newWhere['$labRequest.lab_test_laboratory_id$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const parametersToSurveyResponseSqlWhere = (parameters, { SURVEY_ID }) => {
  const defaultWhereClause = {
    '$surveyResponse.survey_id$': SURVEY_ID,
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$surveyResponse->encounter->patient.village_id$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const getLabTests = async (models, parameters) => {
  return models.LabTest.findAll({
    include: [
      {
        model: models.LabRequest,
        as: 'labRequest',
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            include: [
              {
                model: models.Patient,
                as: 'patient',
                include: [{ model: models.ReferenceData, as: 'village' }],
              },
            ],
          },
          { model: models.ReferenceData, as: 'category' },
          { model: models.ReferenceData, as: 'priority' },
          { model: models.ReferenceData, as: 'laboratory' },
          { model: models.User, as: 'requestedBy' },
        ],
      },
      {
        model: models.LabTestType,
        as: 'labTestType',
      },
    ],
    where: parametersToLabTestSqlWhere(parameters),
    order: [['date', 'ASC']],
  });
};

const getFijiCovidAnswers = async (models, parameters, { SURVEY_ID }) => {
  // Use the latest survey responses per patient above to get the corresponding answers
  const answers = await models.SurveyResponseAnswer.findAll({
    where: parametersToSurveyResponseSqlWhere(parameters, { SURVEY_ID }),
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
        order: [['end_time', 'ASC']],
      },
    ],
  });

  return answers;
};

// Find latest survey response within date range using the answers.
const getLatestPatientAnswerInDateRange = (
  transformedAnswersByPatientAndDataElement,
  currentlabTestDate,
  nextLabTestDate,
  patientId,
  dataElementId,
) => {
  const patientTransformedAnswers =
    transformedAnswersByPatientAndDataElement[`${patientId}|${dataElementId}`];

  if (!patientTransformedAnswers) {
    return undefined;
  }

  const sortedLatestToOldestAnswers = patientTransformedAnswers.sort((a1, a2) =>
    moment(a2.responseEndTime).diff(moment(a1.responseEndTime)),
  );

  const latestAnswer = sortedLatestToOldestAnswers.find(a =>
    moment(a.responseEndTime).isBetween(
      currentlabTestDate,
      nextLabTestDate,
      undefined,
      '[)', // '[)' means currentLabTestDate <= surveyResponse.endTime < nextLabTestDate
    ),
  );

  return latestAnswer?.body;
};

const formatDate = (date, includeTimestamp) =>
  includeTimestamp ? moment(date).format('DD-MM-YYYY LTS') : moment(date).format('DD-MM-YYYY');

const getLabTestRecords = async (
  labTests,
  transformedAnswers,
  parameters,
  { SURVEY_QUESTION_CODES, includeTimestamp },
) => {
  const transformedAnswersByPatientAndDataElement = groupBy(
    transformedAnswers,
    a => `${a.patientId}|${a.dataElementId}`,
  );

  // Group the lab tests by patient so that we can determine the correct sample collection form for each lab request
  // For example, If a patient have 3 lab requests (1st on July 1st, 2nd on July 10th and 3rd on July 15th).
  // For the first request, it should pick the latest sample collection form from July 1st - 9th
  // For the second request, it should pick the latest sample collection forms from July 10th - 14th
  // For the third request, it should pick the latest sample collection form from July 15th onwards.
  const labTestsByPatientId = groupBy(
    labTests,
    labTest => labTest?.labRequest?.encounter?.patientId,
  );

  const results = [];

  for (const [patientId, patientLabTests] of Object.entries(labTestsByPatientId)) {
    // lab tests were already sorted by 'date' ASC in the sql.
    for (let i = 0; i < patientLabTests.length; i++) {
      const labTest = patientLabTests[i];
      const currentLabTestDate = moment(labTest.date).startOf('day');

      // Get all lab tests regardless and filter fromDate and toDate in memory
      // to ensure that we have the date range from current lab test to the next lab test correctly.
      if (
        parameters.fromDate &&
        currentLabTestDate.isBefore(moment(parameters.fromDate).startOf('day'))
      ) {
        continue;
      }

      if (parameters.toDate && currentLabTestDate.isAfter(moment(parameters.toDate).endOf('day'))) {
        continue;
      }

      const nextLabTest = patientLabTests[i + 1];
      let nextLabTestDate;

      if (nextLabTest) {
        const { date: nextLabTestTimestamp } = nextLabTest;
        // if next lab test not on the same date (next one on a different date,
        // startOf('day') to exclude the next date when comparing range later
        if (!currentLabTestDate.isSame(nextLabTestTimestamp, 'day')) {
          nextLabTestDate = moment(nextLabTestTimestamp).startOf('day');
        } else {
          // if next lab test on the same date, just use its raw timestamp
          nextLabTestDate = moment(nextLabTestTimestamp);
        }
      } else {
        // use current time if there's no next lab test
        nextLabTestDate = moment();
      }

      const { labRequest } = labTest;
      const encounter = labRequest?.encounter;
      const patient = encounter?.patient;
      const homeSubDivision = patient?.village?.name;

      const labTestRecord = {
        firstName: patient?.firstName,
        lastName: patient?.lastName,
        dob: patient?.dateOfBirth ? moment(patient?.dateOfBirth).format('DD-MM-YYYY') : '',
        sex: patient?.sex,
        patientId: patient?.displayId,
        homeSubDivision,
        labRequestId: labRequest?.displayId,
        labRequestType: labRequest?.category?.name,
        labTestType: labTest?.labTestType?.name,
        status: LAB_REQUEST_STATUS_LABELS[labRequest?.status] || labRequest?.status,
        result: labTest.result,
        requestedBy: labRequest?.requestedBy?.displayName,
        requestedDate: labTest.date ? moment(labTest.date).format('DD-MM-YYYY') : '',
        testingDate: labTest.completedDate
          ? formatDate(labTest.completedDate, includeTimestamp)
          : '',
        priority: labRequest?.priority?.name,
        testingLaboratory: labRequest?.laboratory?.name,
      };
      Object.entries(SURVEY_QUESTION_CODES).forEach(([key, dataElement]) => {
        labTestRecord[key] = getLatestPatientAnswerInDateRange(
          transformedAnswersByPatientAndDataElement,
          currentLabTestDate,
          nextLabTestDate,
          patientId,
          dataElement,
        );
      });

      results.push(labTestRecord);
      await yieldControl();
    }
  }

  return results;
};

export const baseDataGenerator = async (
  { models },
  parameters = {},
  { SURVEY_ID, reportColumnTemplate, SURVEY_QUESTION_CODES, includeTimestamp = false },
) => {
  const labTests = await getLabTests(models, parameters);
  const answers = await getFijiCovidAnswers(models, parameters, { SURVEY_ID });
  const components = await models.SurveyScreenComponent.getComponentsForSurvey(SURVEY_ID);
  const transformedAnswers = await transformAnswers(models, answers, components);

  const reportData = await getLabTestRecords(labTests, transformedAnswers, parameters, {
    SURVEY_QUESTION_CODES,
    includeTimestamp,
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'LabTest';
