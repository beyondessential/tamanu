import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData, getAgeFromDOB } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';

const FIELD_TO_NAME = {
  firstName: 'First name',
  lastName: 'Last name',
  displayId: 'NHN',
  age: 'Age',
  sex: 'Gender',
  ethnicity: 'Ethnicity',
  contactPhone: 'Contact number',
  clinician: 'Clinician',
  dateOfAttendance: 'Date of attendance',
  department: 'Department',
  location: 'Location',
  reasonForAttendance: 'Reason for attendance',
  diagnosis: 'Diagnosis',
  diagnosisCertainty: 'Diagnosis certainty',
};

const reportColumnTemplate = Object.entries(FIELD_TO_NAME).map(([key, title]) => ({
  title,
  accessor: data => data[key],
}));

const parametersToEncounterSqlWhere = parameters => {
  return Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'diagnosis':
          // TODO: add to sql where
          break;
        case 'fromDate':
          if (!newWhere.startDate) {
            newWhere.startDate = {};
          }
          newWhere.startDate[Op.gte] = value;
          break;
        case 'toDate':
          if (!newWhere.startDate) {
            newWhere.startDate = {};
          }
          newWhere.startDate[Op.lte] = value;
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
        ],
      },
      {
        model: models.User,
        as: 'examiner',
      },
      {
        model: models.EncounterDiagnosis,
        as: 'diagnoses',
        include: [{ model: models.ReferenceData, as: 'Diagnosis' }],
      },
      'department',
      'location',
    ],
    where: parametersToEncounterSqlWhere(parameters),
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

const transformDataPoint = encounter => {
  const { patient, examiner, diagnoses } = encounter;

  const patientAdditionalData = patient.additionalData?.[0];

  console.log(patient);

  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    displayId: patient.displayId,
    age: getAgeFromDOB(patient.dateOfBirth),
    sex: patient.sex,
    ethnicity: patientAdditionalData?.ethnicity?.name,
    contactPhone: patientAdditionalData?.primaryContactNumber,
    clinician: examiner.displayName,
    dateOfAttendance: moment(encounter.startDate).format('DD-MM-YYYY'),
    department: encounter.department?.name,
    location: encounter.location?.name,
    reasonForAttendance: encounter.reasonForEncounter,
    diagnosis: diagnoses[0]?.Diagnosis?.name, // TODO
    diagnosisCertainty: diagnoses[0]?.certainty,
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

export const permission = 'LabTest';
