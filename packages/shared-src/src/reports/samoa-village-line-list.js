import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';

const SCREENING_FORM = 'program-samoancdscreening-sampenvilfrm';
const REFERRAL_FORM = 'program-samoancdscreening-sampenvillref';

const SURVEY_CODES = [SCREENING_FORM, REFERRAL_FORM];

const SURVEY_DATA_ELEMENT_IDS = {
  'pde-samvilFRM-02': 'Screening date',
  'pde-samvillref-2': 'Referral for',
  'pde-samvillref-4': 'Referral To',
  'pde-samvilFRM-04': 'Age (completed years)',
  'pde-samvilFRM-043': 'Contact Number',
  'pde-samvilFRM-030': 'Known diseases',
  'pde-samvilFRM-031': 'Other known disease',
  'pde-samvilFRM-032': 'Individual has been assessed before:',
  'pde-samvilFRM-033': 'When was your last visit?',
  'pde-samvilFRM-06': 'Chest pain, tightness, and/or breathlessness (heart disease)',
  'pde-samvilFRM-07':
    'Left or right -sided weakness of limbs or face, difficulties speaking; permanent or transient; periods of resolving blindness (stroke)',
  'pde-samvilFRM-08':
    'Constant thirst/drinking/passing urine; frequent bacterial infection (UTI, chest infection, skin infections), tiredness, blurred vision, foot ulcers (diabetes)',
  'pde-samvilFRM-10': 'Previously diagnosed with hypertension and /or diabetes mellitus',
  'pde-samvilFRM-11': 'Taking medications',
  'pde-samvilFRM-11a': 'Run out of medications?',
  'pde-samvilFRM-12': 'Tobacco use in the last 12 months',
  'pde-samvilFRM-13':
    'Going to quit smoking/interested in smoking-cessation education and/or regular group session',
  'pde-samvilFRM-14':
    'Has consumed an alcoholic drink such as beer, wine, spirits, or home brew within the past 30 days',
  'pde-samvilFRM-15': 'Consumed 5 or more drinks in one occasion during the past 30 days',
  'pde-samvilFRM-16': 'Number of types of fruits and vegentables eaten yesterday',
  'pde-samvilFRM-17': 'Days per week eats processed or fried foods, canned meat or instant noodles',
  'pde-samvilFRM-18': '30 mins of moderate-intense physical activity 5 days of the week',
  'pde-samvilFRM-19': 'Time spent walking per day in minutes',
  'pde-samvilFRM-20':
    'Parent, sister or brother who was diagnosed with premature heart disease, stroke, DM , cancer or kidney disease',
  'pde-samvilFRM22': 'Height (cm)',
  'pde-samvilFRM23': 'Weight (kg)',
  'pde-samvilFRM-241': 'BMI',
  'pde-samvilFRM-24': 'Waist circumference (cm)',
  'pde-samvilFRM-26': 'Blood pressure (mmHg)',
  'pde-samvilFRM27': 'Systolic 1st reading (mmHg)',
  'pde-samvilFRM30': 'Diastolic 1st reading (mmHg)',
  'pde-samvilFRM-29': 'Systolic average (mmHg)',
  'pde-samvilFRM28': 'Systolic 2nd reading (mmHg)',
  'pde-samvilFRM31': 'Diastolic 2nd reading (mmHg)',
  'pde-samvilFRM-32': 'Diastolic average (mmHg)',
  'pde-samvilFRM-33': 'Pulse rate (bpm)',
  'pde-samvilFRM-34': 'Random glucose 1st reading (mmol/L)',
  'pde-samvilFRM-35': 'Random glucose 2nd reading (mmol/L)',
  'pde-samvilFRM-39': 'Individual pregnant',
  'pde-samvilFRM-40': 'Months pregnant',
  'pde-samvilFRM-41': 'Antenatal check ups',
  'pde-samvilFRM-42': 'Problem with night blindness',
  'pde-samvilFRM-43': 'Acanthosis nigricans',
  'pde-samvilFRM-44': 'Taking iron supplement',
  'pde-samvilFRM-45': 'Taken medication for intestinal worms in the last 6 months',
  $result: 'CVD risk level',
  'pde-samvilFRM-37': 'Form completed by',
  'pde-samvilFRM-37a': 'Name of Assessor',
  'pde-samvilFRM-37b': 'Name of Data Entry',
  // 'pde-samvillref-2': 'Referral for',
  'pde-samvillref-3': 'Other reason for review',
  // 'pde-samvillref-4': 'Referral to',
  'pde-samvillref-5': 'Name of Assessor',
  'pde-samvillref-6': 'Name of Data Entry',
};
const reportColumnTemplate = [
  {
    title: 'First name',
    accessor: data => data.firstName,
  },
  {
    title: 'Last name',
    accessor: data => data.lastName,
  },
  {
    title: 'Display ID',
    accessor: data => data.displayId,
  },
  {
    title: 'Date of Birth',
    accessor: data => data.dateOfBirth,
  },
  {
    title: 'Age',
    accessor: data => data.age,
  },
  {
    title: 'Sex',
    accessor: data => data.sex,
  },
  {
    title: 'Village',
    accessor: data => data.village,
  },
  // { title: 'CVD risk level', accessor: data => data.cvdRiskLevel },

  // {
  //   title: 'Reason for referral',
  //   accessor: data => data.reasonForReferral,
  // },
  ...Object.entries(SURVEY_DATA_ELEMENT_IDS).map(([key, val]) => ({
    title: val,
    accessor: data => data[key],
  })),
];

const parametersToSurveyResponseSqlWhere = parameters => {
  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'fromDate':
            if (!where['$surveyResponse.end_time$']) {
              where['$surveyResponse.end_time$'] = {};
            }
            where['$surveyResponse.end_time$'][Op.gte] = value;
            break;
          case 'toDate':
            if (!where['$surveyResponse.end_time$']) {
              where['$surveyResponse.end_time$'] = {};
            }
            where['$surveyResponse.end_time$'][Op.lte] = value;
            break;
          default:
            break;
        }
        return where;
      },
      {
        '$surveyResponse.survey_id$': SURVEY_CODES,
      },
    );

  return whereClause;
};

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

const getTransformedAnswers = async (models, surveyResponseAnswers, surveyComponents) => {
  const autocompleteComponents = surveyComponents
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      JSON.parse(componentConfig),
    ]);
  const dateDataElementIds = surveyComponents
    .filter(c => ['Date', 'SubmissionDate'].includes(c.dataElement.dataValues.type))
    .map(component => component.dataElementId);
  const autocompleteComponentMap = new Map(autocompleteComponents);

  // Transform Autocomplete answers from: ReferenceData.id to ReferenceData.name
  const transformedAnswers = await Promise.all(
    surveyResponseAnswers
      // Some questions in the front end are not answered but still record the answer as empty string in the database
      // So we should filter any answers thare are empty.
      .filter(answer => answer.body !== null && answer.body !== undefined && answer.body !== '')
      .map(async answer => {
        const surveyResponseId = answer.surveyResponse?.id;
        const patientId = answer.surveyResponse?.encounter?.patientId;
        const responseEndTime = answer.surveyResponse?.endTime;
        const referralTime = answer.surveyResponse?.referral?.createdAt;
        const { dataElementId } = answer;
        const body =
          dateDataElementIds.includes(dataElementId) && answer.body
            ? formatDate(answer?.body)
            : answer.body;
        const componentConfig = autocompleteComponentMap.get(dataElementId);

        const returnObj = {
          surveyResponseId,
          surveyResponse: answer.surveyResponse,
          patientId,
          responseEndTime,
          referralTime,
          dataElementId,
          body,
        };
        if (!componentConfig) {
          return returnObj;
        }
        const result = await models[componentConfig.source]?.findByPk(body);
        if (!result) {
          return returnObj;
        }

        const answerDisplayValue =
          result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
        return {
          ...returnObj,
          body: answerDisplayValue,
        };
      }),
  );

  return transformedAnswers;
};

const getAnswers = async (models, parameters) => {
  return models.SurveyResponseAnswer.findAll({
    where: {
      ...parametersToSurveyResponseSqlWhere(parameters),
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
        order: [['end_time', 'ASC']],
      },
    ],
  });
};

const getKey = (patientId, dataElementId) => `${patientId}|${dataElementId}`;

const getLatestAnswerPerDataElement = transformedAnswers => {
  const seenSurveyResponseIds = new Set();
  // const surveyResponses = transformedAnswers.map(a => a.surveyResponse);
  const surveyResponses = transformedAnswers
    .map(a => a.surveyResponse)
    .filter(({ id }) => {
      if (seenSurveyResponseIds.has(id)) {
        return false;
      }
      seenSurveyResponseIds.add(id);
      return true;
    });
  const transformedAnswersIncResults = [
    ...transformedAnswers,
    ...surveyResponses
      .map(sr => ({
        dataElementId: '$result',
        patientId: sr.encounter.patientId,
        responseEndTime: sr.endTime,
        body: sr.resultText || sr.result,
      }))
      .filter(({ body }) => !!body),
  ];

  const groupedTransformAnswers = groupBy(transformedAnswersIncResults, a =>
    getKey(a.patientId, a.dataElementId),
  );
  const result = {};
  for (const [key, groupedAnswers] of Object.entries(groupedTransformAnswers)) {
    const sortedLatestToOldestAnswers = groupedAnswers.sort((a1, a2) =>
      moment(a2.responseEndTime).diff(moment(a1.responseEndTime)),
    );
    result[key] = sortedLatestToOldestAnswers[0];
  }
  return result;
};

const formatDate = date => {
  return moment(date).format('DD-MM-YYYY');
};

export const dataGenerator = async ({ models }, parameters = {}) => {
  const answers = await getAnswers(models, parameters);
  const components = await models.SurveyScreenComponent.getComponentsForSurveys(SURVEY_CODES);
  const transformedAnswers = await getTransformedAnswers(models, answers, components);
  const surveyResponseIds = transformedAnswers.map(a => a.surveyResponseId);
  const latestAnswerPerDataElement = getLatestAnswerPerDataElement(transformedAnswers);
  const patients = answers.map(a => a.surveyResponse?.encounter?.patient);
  const patientById = keyBy(patients, 'id');
  const reportData = [];

  const referrals = await models.Referral.findAll({
    where: {
      surveyResponseId: { [Op.in]: surveyResponseIds },
    },
    include: [
      {
        model: models.Encounter,
        as: 'initiatingEncounter',
      },
    ],
  });
  const referralBySurveyResponseId = keyBy(referrals, 'surveyResponseId');

  for (const [patientId, patient] of Object.entries(patientById)) {
    const dateOfBirthMoment = patient.dateOfBirth ?? moment(patient.dateOfBirth);
    const dateOfBirth = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '';
    const age = dateOfBirthMoment ? moment().diff(dateOfBirthMoment, 'years') : '';
    const recordData = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      displayId: patient.displayId,
      dateOfBirth,
      sex: patient.sex,
      age,
      village: patient.villageId,
    };
    let surveyResponseId;
    Object.entries(SURVEY_DATA_ELEMENT_IDS).forEach(([dataElementId, _]) => {
      const latestAnswer = latestAnswerPerDataElement[getKey(patientId, dataElementId)];
      recordData[dataElementId] = latestAnswer?.body;
      surveyResponseId = latestAnswer?.surveyResponseId;
    });
    const referral = referralBySurveyResponseId[surveyResponseId];
    recordData.referralDate = referral?.initiatingEncounter?.startDate
      ? formatDate(referral?.initiatingEncounter?.startDate)
      : '';
    reportData.push(recordData);
  }

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'SurveyResponse';
