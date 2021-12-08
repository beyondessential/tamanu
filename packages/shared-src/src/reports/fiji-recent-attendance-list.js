import { Op } from 'sequelize';
import moment from 'moment';
import { DIAGNOSIS_CERTAINTY } from 'shared/constants';
import { getAgeFromDate } from 'shared/utils/date';
import { generateReportFromQueryData } from './utilities';

const FIELD_TO_TITLE = {
  firstName: 'First name',
  lastName: 'Last name',
  displayId: 'NHN',
  age: 'Age',
  sex: 'Gender',
  ethnicity: 'Ethnicity',
  contactPhone: 'Contact number',
  subdivision: 'Subdivision',
  clinician: 'Clinician',
  dateOfAttendance: 'Date of attendance',
  department: 'Department',
  location: 'Location',
  reasonForAttendance: 'Reason for attendance',
  primaryDiagnosis: 'Primary diagnosis',
  otherDiagnoses: 'Other diagnoses',
};

const reportColumnTemplate = Object.entries(FIELD_TO_TITLE).map(([key, title]) => ({
  title,
  accessor: data => data[key],
}));

const parametersToEncounterSqlWhere = parameters => {
  return Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$patient.village_id$'] = value;
          break;
        case 'diagnosis':
          newWhere['$diagnoses.diagnosis_id$'] = value;
          break;
        case 'fromDate':
          if (!newWhere.startDate) {
            newWhere.startDate = {};
          }
          newWhere.startDate[Op.gte] = moment(value).startOf('day');
          break;
        case 'toDate':
          if (!newWhere.startDate) {
            newWhere.startDate = {};
          }
          newWhere.startDate[Op.lte] = moment(value).endOf('day');
          break;
        default:
          break;
      }
      return newWhere;
    }, {});
};

const getEncounters = async (models, parameters) => {
  return models.Encounter.findAll({
    include: [
      {
        model: models.Patient,
        as: 'patient',
        include: [
          {
            model: models.PatientAdditionalData,
            as: 'additionalData',
            include: ['ethnicity'],
          },
          'village',
        ],
      },
      {
        model: models.EncounterDiagnosis,
        as: 'diagnoses',
        include: ['Diagnosis'],
        where: {
          certainty: {
            [Op.notIn]: [DIAGNOSIS_CERTAINTY.DISPROVEN, DIAGNOSIS_CERTAINTY.ERROR],
          },
        },
        required: false,
      },
      'examiner',
      'department',
      'location',
    ],
    where: parametersToEncounterSqlWhere(parameters),
    order: [['startDate', 'ASC']],
  });
};

const getAllDiagnoses = async (models, encounters) => {
  const newEncounters = [];
  for (const encounter of encounters) {
    newEncounters.push({
      ...encounter,
      diagnoses: await models.EncounterDiagnosis.findAll({
        include: ['Diagnosis'],
        where: {
          certainty: {
            [Op.notIn]: [DIAGNOSIS_CERTAINTY.DISPROVEN, DIAGNOSIS_CERTAINTY.ERROR],
          },
          encounterId: encounter.id,
        },
      }),
    });
  }
  return newEncounters;
};

const stringifyDiagnoses = (diagnoses = []) =>
  diagnoses.map(({ Diagnosis, certainty }) => `${Diagnosis.name}: ${certainty}`).join(', ');

const transformDataPoint = encounter => {
  const { patient, examiner, diagnoses } = encounter;

  const patientAdditionalData = patient.additionalData?.[0];

  const primaryDiagnoses = diagnoses.filter(({ isPrimary }) => isPrimary);
  const otherDiagnoses = diagnoses.filter(({ isPrimary }) => !isPrimary);

  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    displayId: patient.displayId,
    age: getAgeFromDate(patient.dateOfBirth),
    sex: patient.sex,
    ethnicity: patientAdditionalData?.ethnicity?.name,
    contactPhone: patientAdditionalData?.primaryContactNumber,
    subdivision: patient.village?.name,
    clinician: examiner?.displayName,
    dateOfAttendance: moment(encounter.startDate).format('DD-MM-YYYY'),
    department: encounter.department?.name,
    location: encounter.location?.name,
    reasonForAttendance: encounter.reasonForEncounter,
    primaryDiagnosis: stringifyDiagnoses(primaryDiagnoses),
    otherDiagnoses: stringifyDiagnoses(otherDiagnoses),
  };
};

export const dataGenerator = async (models, parameters = {}) => {
  let encounters = await getEncounters(models, parameters);
  if (parameters.diagnosis) {
    encounters = await getAllDiagnoses(models, encounters);
  }

  const reportData = encounters.map(transformDataPoint);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
