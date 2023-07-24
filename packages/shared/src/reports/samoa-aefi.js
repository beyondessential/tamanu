import { Op } from 'sequelize';
import { generateReportFromQueryData } from './utilities';

function parametersToSqlWhere(parameters) {
  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      /* eslint-disable no-param-reassign */
      switch (key) {
        case 'village':
          where['$encounter.patient.village_id$'] = value;
          break;
        case 'fromDate':
          if (!where.startTime) {
            where.startTime = {};
          }
          where.startTime[Op.gte] = value;
          break;
        case 'toDate':
          if (!where.startTime) {
            where.startTime = {};
          }
          where.startTime[Op.lt] = value;
          break;
        default:
          break;
      }
      /* eslint-enable no-param-reassign */
      return where;
    }, {});

  return whereClause;
}

export async function dataGenerator({ models }, parameters = {}) {
  // see https://docs.google.com/spreadsheets/d/1xgc_E_RStT6AXWiNzv7pTA9EbjIZEdIR/edit#gid=777794303 for codes
  const aefiSurvey = await models.Survey.findOne({
    where: {
      code: 'samoaaefi',
    },
  });

  const aefiSurveyColumns = await models.SurveyScreenComponent.findAll({
    where: {
      surveyId: aefiSurvey.get('id'),
      '$dataElement.name$': {
        [Op.not]: null,
      },
      '$dataElement.type$': {
        [Op.not]: 'Instruction',
      },
    },
    include: [{ model: models.ProgramDataElement, as: 'dataElement' }],
  });

  const reportColumnTemplate = [
    { title: 'PatientName', accessor: data => `${data.patientFirstName} ${data.patientLastName}` },
    { title: 'Patient ID', accessor: data => data.patientDisplayId },
    { title: 'Most recent vaccine received', accessor: data => data.vaccineLabel },
    { title: 'Batch number', accessor: data => data.vaccineBatchNumber },
  ].concat(
    aefiSurveyColumns.map(c => ({
      title: c.dataElement.name,
      accessor: data => data[c.dataElementId],
    })),
  );

  const whereClause = parametersToSqlWhere(parameters);
  whereClause.surveyId = aefiSurvey.get('id');

  const surveyResponse = await models.SurveyResponse.findAll({
    where: whereClause,
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: [{ model: models.Patient, as: 'patient' }],
      },
      {
        model: models.SurveyResponseAnswer,
        as: 'answers',
      },
    ],
  });

  const surveys = await Promise.all(
    surveyResponse.map(async survey => {
      const vaccine = await getMostRecentVaccineForPatientBeforeSurveyDate(
        models,
        survey?.encounter?.patientId,
        survey.startTime,
      );
      const answersByDataElementId = survey.answers.reduce(
        (allAnswers, answer) => {
          // eslint-disable-next-line no-param-reassign
          allAnswers[answer.dataElementId] = answer.body;
          return allAnswers;
        },
        {
          patientFirstName: survey?.encounter?.patient?.firstName,
          patientLastName: survey?.encounter?.patient?.lastName,
          patientDisplayId: survey?.encounter?.patient?.displayId,
          vaccineLabel: `${vaccine?.scheduledVaccine?.label}, ${vaccine?.scheduledVaccine?.schedule}`,
          vaccineBatchNumber: vaccine?.batch,
        },
      );
      return answersByDataElementId;
    }),
  );

  return generateReportFromQueryData(surveys, reportColumnTemplate);
}

async function getMostRecentVaccineForPatientBeforeSurveyDate(models, patientId, surveyDate) {
  const vaccine = await models.AdministeredVaccine.findOne({
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
    ],
    where: {
      '$encounter.patient_id$': patientId,
      date: { [Op.lte]: surveyDate },
    },
    order: [['date', 'DESC']],
  });
  return vaccine?.get({ plain: true });
}
