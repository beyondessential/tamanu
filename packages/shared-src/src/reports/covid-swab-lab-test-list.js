import { Op } from 'sequelize';
import moment from 'moment';
import { groupBy, keyBy } from 'lodash';
import { generateReportFromQueryData } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

const FIJI_SAMP_SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';

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
        case 'fromDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.gte] = value;
          break;
        case 'toDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.lte] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const parametersToSurveyResponseSqlWhere = parameters => {
  const defaultWhereClause = {
    survey_id: FIJI_SAMP_SURVEY_ID,
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
          newWhere['$encounter->patient.village_id$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const getTransformedAnswers = async (models, surveyResponseAnswers) => {
  const components = await models.SurveyScreenComponent.getComponentsForSurvey(FIJI_SAMP_SURVEY_ID);

  const autocompleteComponents = components
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      JSON.parse(componentConfig),
    ]);
  const autocompleteComponentMap = new Map(autocompleteComponents);

  // Transform Autocomplete answers from: ReferenceData.id to ReferenceData.name
  const transformedAnswers = await Promise.all(
    surveyResponseAnswers.map(async answer => {
      const patientId = answer.surveyResponse?.encounter?.patientId;
      const dataElementId = answer.dataElementId;
      const body = answer.body;
      const componentConfig = autocompleteComponentMap.get(dataElementId);
      if (
        !componentConfig ||
        body === null || // Nothing to transform, so returning raw answer
        body === undefined ||
        body === ''
      ) {
        return {
          patientId,
          dataElementId,
          body,
        };
      }

      const result = await models[componentConfig.source].findByPk(body);
      if (!result) {
        return {
          patientId,
          dataElementId,
          body,
        };
      }

      const answerDisplayValue =
        result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
      const transformedAnswer = {
        patientId,
        dataElementId,
        body: answerDisplayValue,
      };
      return transformedAnswer;
    }),
  );

  return transformedAnswers;
};

const getPatientLatestFijiCovidAnswers = async (models, parameters) => {
  // Get the survey responses for fijicovidsampcollection survey
  const surveyResponses = await models.SurveyResponse.findAll({
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
    ],
    where: parametersToSurveyResponseSqlWhere(parameters),
  });

  const surveyResponsesByPatient = groupBy(
    surveyResponses,
    surveyResponse => surveyResponse.encounter.patient.id,
  );

  // Find the latest survey responses per patient
  const latestSurveyResponsePerPatient = Object.entries(surveyResponsesByPatient).map(
    ([_, patientSurveyResponses]) => {
      const latestSurveyResponse = patientSurveyResponses.sort((s1, s2) =>
        moment(s2.dataValues.endTime).diff(moment(s1.dataValues.endTime)),
      );

      return latestSurveyResponse[0];
    },
  );

  // Use the latest survey responses per patient above to get the corresponding answers
  return models.SurveyResponseAnswer.findAll({
    where: {
      response_id: latestSurveyResponsePerPatient.map(s => s.dataValues.id),
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
  });
};

const reportColumnTemplate = [
  {
    title: 'Patient first name',
    accessor: data => data.firstName,
  },
  {
    title: 'Patient last name',
    accessor: data => data.lastName,
  },
  {
    title: 'DOB',
    accessor: data => data.dob,
  },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.patientId },
  { title: 'Lab request ID', accessor: data => data.labRequestId },
  {
    title: 'Lab request type',
    accessor: data => data.labRequestType,
  },
  {
    title: 'Status',
    accessor: data => data.status,
  },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requestedBy },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  { title: 'Health facility', accessor: data => data.healthFacility },
  { title: 'Division', accessor: data => data.division },
  { title: 'Sub-division', accessor: data => data.subDivision },
  { title: 'Ethnicity', accessor: data => data.ethnicity },
  { title: 'Contact phone', accessor: data => data.contactPhone },
  { title: 'Residential address', accessor: data => data.residentialAddress },
  { title: 'Latitude coordinate', accessor: data => data.latitude },
  { title: 'Longitude coordinate', accessor: data => data.longitude },
  { title: 'Purpose of sample collection', accessor: data => data.purposeOfSample },
  { title: 'Recent admission', accessor: data => data.recentAdmission },
  { title: 'Admission date', accessor: data => data.admissionDate },
  { title: 'Place of admission', accessor: data => data.placeOfAdmission },
  { title: 'Medical problems', accessor: data => data.medicalProblems },
  { title: 'Healthcare worker', accessor: data => data.healthcareWorker },
  { title: 'Occupation', accessor: data => data.occupation },
  { title: 'Place of work', accessor: data => data.placeOfWork },
  { title: 'Link to cluster/case', accessor: data => data.linkToCluster },
  { title: 'Name of cluster', accessor: data => data.nameOfCluster },
  { title: 'Recent travel history', accessor: data => data.recentTravelHistory },
  { title: 'Pregnant', accessor: data => data.pregnant },
  { title: 'Experiencing symptoms', accessor: data => data.experiencingSymptoms },
  { title: 'Date of first symptom', accessor: data => data.dateOfFirstSymptom },
  { title: 'Symptoms', accessor: data => data.symptoms },
  { title: 'Vaccinated', accessor: data => data.vaccinated },
  { title: 'Date of 1st dose', accessor: data => data.dateOf1stDose },
  { title: 'Date of 2nd dose', accessor: data => data.dateOf2ndDose },
];

export const dataGenerator = async (models, parameters = {}) => {
  // Fetch lab tests
  const labTestsData = await models.LabTest.findAll({
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
  });

  const patientLatestFijiCovidAnswers = await getPatientLatestFijiCovidAnswers(models, parameters);

  const transformedAnswers = await getTransformedAnswers(models, patientLatestFijiCovidAnswers);
  const surveyResponseAnswerByEncounterAndCode = keyBy(
    transformedAnswers,
    a => `${a.patientId}|${a.dataElementId}`, // should only have 1 survey response (LATEST ONE) per patient
  );

  const getAnswer = key => surveyResponseAnswerByEncounterAndCode[key]?.body;

  const reportData = labTestsData.map(labTest => {
    const patientId = labTest.labRequest.encounter.patientId;
    return {
      firstName: labTest.labRequest?.encounter?.patient?.firstName,
      lastName: labTest.labRequest?.encounter?.patient?.lastName,
      dob: labTest.labRequest?.encounter?.patient?.dateOfBirth
        ? moment(labTest.labRequest?.encounter?.patient?.dateOfBirth).format('DD-MM-YYYY')
        : '',
      sex: labTest.labRequest?.encounter?.patient?.sex,
      patientId: labTest.labRequest?.encounter?.patient?.displayId,
      labRequestId: labTest.labRequest?.displayId,
      labRequestType: labTest.labRequest.category.name,
      status: LAB_REQUEST_STATUS_LABELS[labTest.labRequest?.status] || labTest.labRequest?.status,
      result: labTest.result,
      requestedBy: labTest.labRequest?.requestedBy?.displayName,
      requestedDate: labTest.date ? moment(labTest.date).format('DD-MM-YYYY') : '',
      testingDate: labTest.completedDate ? moment(labTest.completedDate).format('DD-MM-YYYY') : '',
      priority: labTest.labRequest?.priority?.name,
      testingLaboratory: labTest.labRequest?.laboratory?.name,
      healthFacility: getAnswer(`${patientId}|pde-FijCOVSamp4`),
      division: getAnswer(`${patientId}|pde-FijCOVSamp6`),
      subDivision: getAnswer(`${patientId}|pde-FijCOVSamp7`),
      ethnicity: getAnswer(`${patientId}|pde-FijCOVSamp10`),
      contactPhone: getAnswer(`${patientId}|pde-FijCOVSamp11`),
      residentialAddress: getAnswer(`${patientId}|pde-FijCOVSamp12`),
      latitude: getAnswer(`${patientId}|pde-FijCOVSamp13`),
      longitude: getAnswer(`${patientId}|pde-FijCOVSamp14`),
      purposeOfSample: getAnswer(`${patientId}|pde-FijCOVSamp15`),
      recentAdmission: getAnswer(`${patientId}|pde-FijCOVSamp16`),
      admissionDate: getAnswer(`${patientId}|pde-FijCOVSamp19`),
      placeOfAdmission: getAnswer(`${patientId}|pde-FijCOVSamp20`),
      medicalProblems: getAnswer(`${patientId}|pde-FijCOVSamp23`),
      healthcareWorker: getAnswer(`${patientId}|pde-FijCOVSamp26`),
      occupation: getAnswer(`${patientId}|pde-FijCOVSamp27`),
      placeOfWork: getAnswer(`${patientId}|pde-FijCOVSamp28`),
      linkToCluster: getAnswer(`${patientId}|pde-FijCOVSamp29`),
      nameOfCluster: getAnswer(`${patientId}|pde-FijCOVSamp30`),
      recentTravelHistory: getAnswer(`${patientId}|pde-FijCOVSamp31`),
      pregnant: getAnswer(`${patientId}|pde-FijCOVSamp32`),
      experiencingSymptoms: getAnswer(`${patientId}|pde-FijCOVSamp34`),
      dateOfFirstSymptom: getAnswer(`${patientId}|pde-FijCOVSamp35`),
      symptoms: getAnswer(`${patientId}|pde-FijCOVSamp36`),
      vaccinated: getAnswer(`${patientId}|pde-FijCOVSamp38`),
      dateOf1stDose: getAnswer(`${patientId}|pde-FijCOVSamp39`),
      dateOf2ndDose: getAnswer(`${patientId}|pde-FijCOVSamp40`),
    };
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'LabTest';
