import { Op } from 'sequelize';
import moment from 'moment';
import { keyBy } from 'lodash';
import { generateReportFromQueryData } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

const parametersToSqlWhere = parameters => {
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

export const permission = 'LabTest';

const getTransformedAnswers = async (models, surveyResponseAnswers) => {
  const components = await models.SurveyScreenComponent.getComponentsForSurvey(
    'program-fijicovid19-fijicovidsampcollection',
  );

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
      const componentConfig = autocompleteComponentMap.get(answer.dataElementId);
      if (
        !componentConfig ||
        answer.body === null || // Nothing to transform, so returning raw answer
        answer.body === undefined ||
        answer.body === ''
      ) {
        return {
          encounterId: answer.surveyResponse.encounterId,
          dataElementId: answer.dataElementId,
          body: answer.body,
        };
      }

      const result = await models[componentConfig.source].findByPk(answer.body);
      if (!result) {
        return {
          encounterId: answer.surveyResponse.encounterId,
          dataElementId: answer.dataElementId,
          body: answer.body,
        };
      }

      const answerDisplayValue =
        result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
      const transformedAnswer = {
        encounterId: answer.surveyResponse.encounterId,
        dataElementId: answer.dataElementId,
        body: answerDisplayValue,
      };
      return transformedAnswer;
    }),
  );

  return transformedAnswers;
};

export const dataGenerator = async (models, parameters = {}) => {
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
    { title: 'Pregnant', accessor: data => data.pregnant },
    { title: 'Experiencing symptoms', accessor: data => data.experiencingSymptoms },
    { title: 'Date of first symptom', accessor: data => data.dateOfFirstSymptom },
    { title: 'Symptoms', accessor: data => data.symptoms },
    { title: 'Vaccinated', accessor: data => data.vaccinated },
    { title: 'Date of 1st dose', accessor: data => data.dateOf1stDose },
    { title: 'Date of 2nd dose', accessor: data => data.dateOf2ndDose },
  ];

  const whereClause = parametersToSqlWhere(parameters);

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
    where: whereClause,
  });

  // Fetch the corresponding survey response answers of the same lab request encounter
  const surveyResponseAnswers = await models.SurveyResponseAnswer.findAll({
    where: {
      '$surveyResponse.encounter_id$': labTestsData.map(lt => lt.labRequest.encounterId),
    },
    include: [
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
          },
        ],
      },
    ],
  });

  const transformedAnswers = await getTransformedAnswers(models, surveyResponseAnswers);
  const surveyResponseAnswerByEncounterAndCode = keyBy(
    transformedAnswers,
    a => `${a.encounterId}|${a.dataElementId}`,
  );

  const getAnswer = key => surveyResponseAnswerByEncounterAndCode[key]?.body;

  const reportData = labTestsData.map(labTest => {
    const encounterId = labTest.labRequest.encounterId;
    return {
      firstName: labTest.labRequest?.encounter?.patient?.firstName,
      lastName: labTest.labRequest?.encounter?.patient?.lastName,
      dob: moment(labTest.labRequest?.encounter?.patient?.dateOfBirth).format('DD-MM-YYYY'),
      sex: labTest.labRequest?.encounter?.patient?.sex,
      patientId: labTest.labRequest?.encounter?.patient?.displayId,
      labRequestId: labTest.labRequest?.displayId,
      labRequestType: labTest.labRequest.category.name,
      status: LAB_REQUEST_STATUS_LABELS[labTest.labRequest?.status] || labTest.labRequest?.status,
      result: labTest.result,
      requestedBy: labTest.labRequest?.requestedBy?.displayName,
      requestedDate: moment(labTest.date).format('DD-MM-YYYY'),
      testingDate: moment(labTest.completedDate).format('DD-MM-YYYY'),
      priority: labTest.labRequest?.priority?.name,
      testingLaboratory: labTest.labRequest?.laboratory?.name,
      healthFacility: getAnswer(`${encounterId}|pde-FijCOVSamp4`),
      division: getAnswer(`${encounterId}|pde-FijCOVSamp6`),
      subDivision: getAnswer(`${encounterId}|pde-FijCOVSamp7`),
      ethnicity: getAnswer(`${encounterId}|pde-FijCOVSamp10`),
      contactPhone: getAnswer(`${encounterId}|pde-FijCOVSamp11`),
      residentialAddress: getAnswer(`${encounterId}|pde-FijCOVSamp12`),
      latitude: getAnswer(`${encounterId}|pde-FijCOVSamp13`),
      longitude: getAnswer(`${encounterId}|pde-FijCOVSamp14`),
      purposeOfSample: getAnswer(`${encounterId}|pde-FijCOVSamp15`),
      recentAdmission: getAnswer(`${encounterId}|pde-FijCOVSamp16`),
      admissionDate: getAnswer(`${encounterId}|pde-FijCOVSamp19`),
      placeOfAdmission: getAnswer(`${encounterId}|pde-FijCOVSamp20`),
      medicalProblems: getAnswer(`${encounterId}|pde-FijCOVSamp23`),
      healthcareWorker: getAnswer(`${encounterId}|pde-FijCOVSamp26`),
      occupation: getAnswer(`${encounterId}|pde-FijCOVSamp27`),
      placeOfWork: getAnswer(`${encounterId}|pde-FijCOVSamp28`),
      linkToCluster: getAnswer(`${encounterId}|pde-FijCOVSamp29`),
      nameOfCluster: getAnswer(`${encounterId}|pde-FijCOVSamp30`),
      pregnant: getAnswer(`${encounterId}|pde-FijCOVSamp32`),
      experiencingSymptoms: getAnswer(`${encounterId}|pde-FijCOVSamp34`),
      dateOfFirstSymptom: getAnswer(`${encounterId}|pde-FijCOVSamp35`),
      symptoms: getAnswer(`${encounterId}|pde-FijCOVSamp36`),
      vaccinated: getAnswer(`${encounterId}|pde-FijCOVSamp38`),
      dateOf1stDose: getAnswer(`${encounterId}|pde-FijCOVSamp39`),
      dateOf2ndDose: getAnswer(`${encounterId}|pde-FijCOVSamp40`),
    };
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
