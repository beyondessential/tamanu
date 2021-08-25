/* eslint-disable camelcase */
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';

const SURVEY_QUESTION_CODES = [
  'pde-FijCOVSamp4',
  'pde-FijCOVSamp6',
  'pde-FijCOVSamp7',
  'pde-FijCOVSamp10',
  'pde-FijCOVSamp11',
  'pde-FijCOVSamp12',
  'pde-FijCOVSamp13',
  'pde-FijCOVSamp14',
  'pde-FijCOVSamp15',
  'pde-FijCOVSamp16',
  'pde-FijCOVSamp19',
  'pde-FijCOVSamp20',
  'pde-FijCOVSamp23',
  'pde-FijCOVSamp26',
  'pde-FijCOVSamp27',
  'pde-FijCOVSamp28',
  'pde-FijCOVSamp29',
  'pde-FijCOVSamp30',
  'pde-FijCOVSamp31',
  'pde-FijCOVSamp32',
  'pde-FijCOVSamp34',
  'pde-FijCOVSamp35',
  'pde-FijCOVSamp36',
  'pde-FijCOVSamp38',
  'pde-FijCOVSamp39',
  'pde-FijCOVSamp40',
  'pde-FijCOVSamp42',
  'pde-FijCOVSamp43',
  'pde-FijCOVSamp52',
  'pde-FijCOVSamp59',
  'pde-FijCOVSamp60',
  'pde-FijCOVSamp61',
];

const reportColumnTemplate = [
  { title: 'Patient first name', accessor: data => data.first_name },
  { title: 'Patient last name', accessor: data => data.last_name },
  {
    title: 'DOB',
    accessor: data => (data.date_of_birth ? moment(data.date_of_birth).format('DD-MM-YYYY') : ''),
  },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.display_id },

  { title: 'Rapid diagnostic test (RDT) conducted', accessor: data => data['pde-FijCOVSamp42'] },
  { title: 'RDT result', accessor: data => data['pde-FijCOVSamp43'] },
  { title: 'RDT date', accessor: data => data['pde-FijCOVSamp52'] },

  { title: 'Lab request ID', accessor: data => data.lab_request_display_id },
  { title: 'Lab test type', accessor: data => data.lab_test_type_name },
  { title: 'Status', accessor: data => LAB_REQUEST_STATUS_LABELS[data.status] || data.status },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requested_by_name },
  {
    title: 'Requested date',
    accessor: data =>
      data.lab_requested_date ? moment(data.lab_requested_date).format('DD-MM-YYYY') : '',
  },
  { title: 'Priority', accessor: data => data.lab_request_priority_name },
  { title: 'Testing laboratory', accessor: data => data.lab_request_laboratory_name },
  {
    title: 'Testing date',
    accessor: data => (data.completed_date ? moment(data.completed_date).format('DD-MM-YYYY') : ''),
  },

  { title: 'Health facility', accessor: data => data['pde-FijCOVSamp4'] },
  { title: 'Division', accessor: data => data['pde-FijCOVSamp6'] },
  { title: 'Sub-division', accessor: data => data['pde-FijCOVSamp7'] },
  { title: 'Ethnicity', accessor: data => data['pde-FijCOVSamp10'] },
  { title: 'Contact phone', accessor: data => data['pde-FijCOVSamp11'] },
  { title: 'Residential address', accessor: data => data['pde-FijCOVSamp12'] },
  { title: 'Latitude coordinate', accessor: data => data['pde-FijCOVSamp13'] },
  { title: 'Longitude coordinate', accessor: data => data['pde-FijCOVSamp14'] },
  { title: 'Purpose of sample collection', accessor: data => data['pde-FijCOVSamp15'] },
  { title: 'Recent admission', accessor: data => data['pde-FijCOVSamp16'] },
  { title: 'Admission date', accessor: data => data['pde-FijCOVSamp19'] },
  { title: 'Place of admission', accessor: data => data['pde-FijCOVSamp20'] },
  { title: 'Medical problems', accessor: data => data['pde-FijCOVSamp23'] },
  { title: 'Healthcare worker', accessor: data => data['pde-FijCOVSamp26'] },
  { title: 'Occupation', accessor: data => data['pde-FijCOVSamp27'] },
  { title: 'Place of work', accessor: data => data['pde-FijCOVSamp28'] },
  { title: 'Link to cluster/case', accessor: data => data['pde-FijCOVSamp29'] },
  { title: 'Name of cluster', accessor: data => data['pde-FijCOVSamp30'] },
  { title: 'Recent travel history', accessor: data => data['pde-FijCOVSamp31'] },
  { title: 'Pregnant', accessor: data => data['pde-FijCOVSamp32'] },
  { title: 'Experiencing symptoms', accessor: data => data['pde-FijCOVSamp34'] },
  { title: 'Date of first symptom', accessor: data => data['pde-FijCOVSamp35'] },
  { title: 'Symptoms', accessor: data => data['pde-FijCOVSamp36'] },
  { title: 'Vaccinated', accessor: data => data['pde-FijCOVSamp38'] },
  { title: 'Date of 1st dose', accessor: data => data['pde-FijCOVSamp39'] },
  { title: 'Date of 2nd dose', accessor: data => data['pde-FijCOVSamp40'] },
  {
    title: 'Patient is at a higher risk of developing severe COVID-19',
    accessor: data => data['pde-FijCOVSamp59'],
  },
  {
    title: 'Patient has a primary contact who is at a higher risk for developing severe COVID-19',
    accessor: data => data['pde-FijCOVSamp60'],
  },
  { title: 'Details of high risk primary contact', accessor: data => data['pde-FijCOVSamp61'] },
];

export const dataGenerator = async (models, parameters = {}) => {
  const sequelize = models.Patient.sequelize;

  const [referenceResults] = await sequelize.query(`
    select id, name
    from reference_data
    where type IN('facility', 'division', 'ethnicity');
  `);

  const referenceDataIdToNames = referenceResults.reduce(
    (data, { id, name }) => ({ ...data, [id]: name }),
    {},
  );

  const [requestResults] = await sequelize.query(
    `
    select
      pa.id, pa.village_id, pa.first_name, pa.last_name, pa.date_of_birth, pa.sex, pa.display_id,
      lr.id as lab_request_id, lr.requested_date, lr.lab_test_laboratory_id,
      lr.display_id as lab_request_display_id, lr.status, lr.requested_date as lab_requested_date,
      users.display_name as requested_by_name,
      test_priority.name as lab_request_priority_name,
      test_laboratory.name as lab_request_laboratory_name
    from lab_requests lr
    left join encounters en on en.id = lr.encounter_id
    left join patients pa on pa.id = en.patient_id
    left join users on users.id = lr.requested_by_id
    left join reference_data test_priority on test_priority.id = lr.lab_test_priority_id
    left join reference_data test_laboratory on test_laboratory.id = lr.lab_test_laboratory_id
    where
      lr.lab_test_category_id = 'labTestCategory-COVID'
    order by lr.requested_date DESC;
  `,
  );

  // As we've already sorted by date in the query, we take the first result
  // per patient and discard any following results.
  const latestLabRequestByPatient = requestResults.reduce((data, result) => {
    const newData = { ...data };
    const { village, labTestLaboratory, fromDate, toDate } = parameters;

    // Filter results for given parameters
    if (village && result.village_id !== village) return newData;
    if (labTestLaboratory && result.lab_test_laboratory_id !== labTestLaboratory) return newData;

    const labDate = moment(result.requested_date);
    if (fromDate && !toDate && labDate.isBefore(fromDate, 'day')) return newData;
    if (!fromDate && toDate && labDate.isAfter(toDate, 'day')) return newData;
    if (fromDate && toDate && !labDate.isBetween(fromDate, toDate, 'day', '[]')) return newData;

    if (!data[result.id]) {
      newData[result.id] = result;
    }

    return newData;
  }, {});

  let labRequestIds = Object.values(latestLabRequestByPatient).map(x => x.lab_request_id);
  if (labRequestIds.length === 0) labRequestIds = null;
  const [labTestResults] = await sequelize.query(
    `
      select result, completed_date, lab_request_id,
        lab_test_types.name as lab_test_type_name
      from lab_tests
      left join lab_test_types on lab_test_types.id = lab_tests.lab_test_type_id
      where lab_request_id IN(:ids)
      order by result DESC;
    `,
    {
      replacements: { ids: labRequestIds },
    },
  );

  const labTestByRequestId = labTestResults.reduce((data, labTest) => {
    const newData = { ...data };

    // We keep the first lab test per lab request to cover the edge-case
    // of users selecting more than 1 covid test on a single lab request.
    // We always want to show the test that has a result (thus ordering by result),
    // otherwise we don't care which test info we show if there's multiple.
    // (because it's impossible for us to know which test will be done)
    if (!data[labTest.lab_request_id]) newData[labTest.lab_request_id] = labTest;

    return newData;
  }, {});

  const [surveyResponseResults] = await sequelize.query(`
    select sr.id as response_id, pa.id as patient_id, sr.end_time
    from survey_responses sr
    left join encounters en on en.id = sr.encounter_id
    left join patients pa on pa.id = en.patient_id
    where
      survey_id = 'program-fijicovid19-fijicovidsampcollection'
    order by sr.end_time DESC;
  `);

  const latestCovidSurveyByPatient = surveyResponseResults.reduce((data, result) => {
    const newData = { ...data };

    if (!data[result.patient_id]) newData[result.patient_id] = result;

    return newData;
  }, {});

  let surveyResponseIds = Object.values(latestCovidSurveyByPatient).map(x => x.response_id);
  if (surveyResponseIds.length === 0) surveyResponseIds = null;
  const [surveyAnswerResults] = await sequelize.query(
    `
      select body, response_id, data_element_id
      from survey_response_answers
      where data_element_id IN(:data_element_ids);
    `,
    {
      replacements: {
        response_ids: surveyResponseIds,
        data_element_ids: SURVEY_QUESTION_CODES,
      },
    },
  );

  const answersByResponseId = surveyAnswerResults.reduce((data, result) => {
    const newData = { ...data };

    if (!newData[result.response_id]) newData[result.response_id] = {};
    newData[result.response_id][result.data_element_id] = result.body;

    return newData;
  }, {});

  const [surveyRdtResults] = await sequelize.query(
    `
      select sra.response_id, en.patient_id,
        pa.first_name, pa.last_name, pa.date_of_birth,
        pa.sex, pa.display_id
      from survey_response_answers sra
      left join survey_responses sr on sr.id = sra.response_id
      left join encounters en on en.id = sr.encounter_id
      left join patients pa on pa.id = en.patient_id
      where data_element_id = 'pde-FijCOVSamp42' and body = 'Yes'
      order by sr.end_time DESC;
    `,
  );
  const latestRdtSurveyByPatient = surveyRdtResults.reduce((data, result) => {
    const newData = { ...data };

    if (!data[result.patient_id]) {
      newData[result.patient_id] = result;
    }

    return newData;
  }, {});

  const labRows = [];
  const rdtRows = [];

  for (const [patientId, surveyData] of Object.entries(latestRdtSurveyByPatient)) {
    const { response_id, patient_id, ...patientDetails } = surveyData;

    if (!latestLabRequestByPatient[patientId]) {
      const {
        'pde-FijCOVSamp4': FijCOVSamp4,
        'pde-FijCOVSamp6': FijCOVSamp6,
        'pde-FijCOVSamp10': FijCOVSamp10,
        ...answers
      } = answersByResponseId[response_id];

      rdtRows.push({
        ...patientDetails,
        ...answers,
        'pde-FijCOVSamp4': referenceDataIdToNames[FijCOVSamp4] || '',
        'pde-FijCOVSamp6': referenceDataIdToNames[FijCOVSamp6] || '',
        'pde-FijCOVSamp10': referenceDataIdToNames[FijCOVSamp10] || '',
      });
    }
  }

  for (const [patientId, labData] of Object.entries(latestLabRequestByPatient)) {
    let rowData = {};
    const { id, lab_request_id, requested_date, ...labDataToInclude } = labData;
    const { lab_request_id: request_id, ...testDataToInclude } = labTestByRequestId[lab_request_id];

    rowData = { ...labDataToInclude, ...testDataToInclude };

    if (latestCovidSurveyByPatient[patientId]) {
      const { response_id, end_time } = latestCovidSurveyByPatient[patientId];

      const minDate = new Date(requested_date);
      minDate.setDate(minDate.getDate() - 5);

      const maxDate = new Date(requested_date);
      maxDate.setDate(maxDate.getDate() + 5);

      if (moment(end_time).isBetween(minDate, maxDate, 'day', '[]')) {
        const {
          'pde-FijCOVSamp4': FijCOVSamp4,
          'pde-FijCOVSamp6': FijCOVSamp6,
          'pde-FijCOVSamp10': FijCOVSamp10,
          ...answers
        } = answersByResponseId[response_id];

        rowData = {
          ...rowData,
          ...answers,
          'pde-FijCOVSamp4': referenceDataIdToNames[FijCOVSamp4] || '',
          'pde-FijCOVSamp6': referenceDataIdToNames[FijCOVSamp6] || '',
          'pde-FijCOVSamp10': referenceDataIdToNames[FijCOVSamp10] || '',
        };
      } else if (latestRdtSurveyByPatient[patientId]) {
        const {
          response_id: rdt_response_id,
          patient_id,
          ...patientDetails
        } = latestRdtSurveyByPatient[patientId];

        const {
          'pde-FijCOVSamp4': FijCOVSamp4,
          'pde-FijCOVSamp6': FijCOVSamp6,
          'pde-FijCOVSamp10': FijCOVSamp10,
          ...answers
        } = answersByResponseId[rdt_response_id];

        rdtRows.push({
          ...patientDetails,
          ...answers,
          'pde-FijCOVSamp4': referenceDataIdToNames[FijCOVSamp4] || '',
          'pde-FijCOVSamp6': referenceDataIdToNames[FijCOVSamp6] || '',
          'pde-FijCOVSamp10': referenceDataIdToNames[FijCOVSamp10] || '',
        });
      }
    }

    labRows.push(rowData);
  }

  const allRows = [...labRows, ...rdtRows];
  return generateReportFromQueryData(allRows, reportColumnTemplate);
};

export const permission = 'LabTest';
