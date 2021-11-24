import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData, getAgeFromDOB } from './utilities';

const FIELD_TO_NAME = {
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
  primaryDiagnosisCertainty: 'Primary diagnosis certainty',
  otherDiagnoses: 'Other diagnoses',
};

const reportColumnTemplate = Object.entries(FIELD_TO_NAME).map(([key, title]) => ({
  title,
  accessor: data => data[key],
}));

const parametersToEncounterSqlWhere = parameters => {
  return Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        const newWhere = { ...where };
        switch (key) {
          case 'village':
            newWhere['$patient.village_id$'] = value;
            break;
          // case 'diagnosis':
          //   newWhere['$diagnoses.diagnosis_id$'] = value;
          //   break;
          case 'fromDate':
            newWhere.startDate[Op.gte] = value;
            break;
          case 'toDate':
            newWhere.startDate[Op.lte] = value;
            break;
          default:
            break;
        }
        return newWhere;
      },
      {
        startDate: {},
      },
    );
};

const getEncounters = async (models, parameters) => {
  const { diagnosis, ...rest } = parameters;
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
      },
      'examiner',
      'department',
      'location',
    ],
    where: parametersToEncounterSqlWhere(rest),
    order: [['startDate', 'ASC']],
    limit: 200,
  });
};

const hasDiagnosis = parameters => encounter => {
  const { diagnosis } = parameters;
  const { diagnoses } = encounter;
  if (!diagnosis) return true;
  return diagnosis in diagnoses.map(({ id }) => id);
};
const stringifyDiagnoses = (diagnoses = []) =>
  diagnoses.map(({ Diagnosis, certainty }) => `${Diagnosis.name}: ${certainty}`).join(', ');

const transformDataPoint = encounter => {
  const { patient, examiner, diagnoses } = encounter;

  const patientAdditionalData = patient.additionalData?.[0];

  console.log(patient);
  const primaryDiagnoses = diagnoses.filter(({ isPrimary }) => isPrimary);
  const otherDiagnoses = diagnoses.filter(({ isPrimary }) => !isPrimary);

  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    displayId: patient.displayId,
    age: getAgeFromDOB(patient.dateOfBirth),
    sex: patient.sex,
    ethnicity: patientAdditionalData?.ethnicity?.name,
    contactPhone: patientAdditionalData?.primaryContactNumber,
    subdivision: patient.village?.name,
    clinician: examiner.displayName,
    dateOfAttendance: moment(encounter.startDate).format('DD-MM-YYYY'),
    department: encounter.department?.name,
    location: encounter.location?.name,
    reasonForAttendance: encounter.reasonForEncounter,
    primaryDiagnosis: stringifyDiagnoses(primaryDiagnoses), // TODO
    otherDiagnoses: stringifyDiagnoses(otherDiagnoses),
  };
};

const transformData = (encounters, parameters) => {
  return encounters.filter(hasDiagnosis(parameters)).map(transformDataPoint);
};

export const dataGenerator = async (models, parameters = {}) => {
  const encounters = await getEncounters(models, parameters);

  const reportData = transformData(encounters, parameters);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
