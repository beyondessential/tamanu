import { Op } from 'sequelize';
import moment from 'moment';
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
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const parametersToSurveyResponseSqlWhere = parameters => {
  const defaultWhereClause = {
    '$surveyResponse.survey_id$': FIJI_SAMP_SURVEY_ID,
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
      const surveyResponseId = answer.surveyResponse?.id;
      const patientId = answer.surveyResponse?.encounter?.patientId;
      const responseEndTime = answer.surveyResponse?.endTime;
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
          surveyResponseId,
          patientId,
          responseEndTime,
          dataElementId,
          body,
        };
      }

      const result = await models[componentConfig.source].findByPk(body);
      if (!result) {
        return {
          surveyResponseId,
          patientId,
          responseEndTime,
          dataElementId,
          body,
        };
      }

      const answerDisplayValue =
        result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
      const transformedAnswer = {
        surveyResponseId,
        patientId,
        responseEndTime,
        dataElementId,
        body: answerDisplayValue,
      };
      return transformedAnswer;
    }),
  );

  return transformedAnswers;
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

const getFijiCovidAnswers = async (models, parameters) => {
  // Use the latest survey responses per patient above to get the corresponding answers
  const answers = await models.SurveyResponseAnswer.findAll({
    where: parametersToSurveyResponseSqlWhere(parameters),
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
  const labTests = await getLabTests(models, parameters);

  const answers = await getFijiCovidAnswers(models, parameters);

  const transformedAnswers = await getTransformedAnswers(models, answers);

  const getLatestAnswerInDateRange = (labTestDate, nextLabTestDate, patientId, dataElementId) => {
    const answersInRange = transformedAnswers
      .filter(
        a =>
          moment(a.responseEndTime).isBetween(labTestDate, nextLabTestDate, undefined, '[)') &&
          a.patientId === patientId &&
          a.dataElementId === dataElementId,
      )
      .sort((a1, a2) => moment(a1.responseEndTime).diff(moment(a2.responseEndTime)));

    return answersInRange[answersInRange.length - 1]?.body;
  };

  const reportData = [];

  // lab tests were already sorted in the sql.
  for (let i = 0; i < labTests.length; i++) {
    const labTest = labTests[i];
    const currentLabTestDate = moment(labTest.date);

    //Get all lab tests regardless and filter fromDate and toDate in memory
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

    // If reaching the end of the array, use the current moment.
    const nextLabTestDate = labTests[i + 1] ? moment(labTests[i + 1].date) : moment();

    const patientId = labTest.labRequest?.encounter?.patientId;

    const labTestRecord = {
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
      healthFacility: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp4',
      ),
      division: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp6',
      ),
      subDivision: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp7',
      ),
      ethnicity: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp10',
      ),
      contactPhone: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp11',
      ),
      residentialAddress: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp12',
      ),
      latitude: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp13',
      ),
      longitude: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp14',
      ),
      purposeOfSample: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp15',
      ),
      recentAdmission: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp16',
      ),
      admissionDate: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp19',
      ),
      placeOfAdmission: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp20',
      ),
      medicalProblems: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp23',
      ),
      healthcareWorker: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp26',
      ),
      occupation: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp27',
      ),
      placeOfWork: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp28',
      ),
      linkToCluster: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp29',
      ),
      nameOfCluster: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp30',
      ),
      recentTravelHistory: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp31',
      ),
      pregnant: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp32',
      ),
      experiencingSymptoms: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp34',
      ),
      dateOfFirstSymptom: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp35',
      ),
      symptoms: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp36',
      ),
      vaccinated: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp38',
      ),
      dateOf1stDose: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp39',
      ),
      dateOf2ndDose: getLatestAnswerInDateRange(
        currentLabTestDate,
        nextLabTestDate,
        patientId,
        'pde-FijCOVSamp40',
      ),
    };

    reportData.push(labTestRecord);
  }

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'LabTest';
