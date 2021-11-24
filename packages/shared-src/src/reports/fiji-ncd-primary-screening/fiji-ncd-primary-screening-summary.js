import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData, getAgeFromDOB } from '../utilities';

const SCREENING_TYPES = {
  // fijicvdprimaryscreen: 'CVD Primary Screening Form',
  // fijibreastprimaryscreen: 'Breast Cancer Primary Screening Form',
  // fijicervicalprimaryscreen: 'Cervical Cancer Primary Screening Form',
  fijicvdprimary: 'CVD Primary Screening Form',
  fijibreastprimary: 'Breast Cancer Primary Screening Form',
  fijicervicalprimary: 'Cervical Cancer Primary Screening Form',
};

const REFERRAL_FORMS = {
  fijicvdprimaryreferral: 'CVD Primary Screening Referral',
  fijicervicalprimaryreferral: 'Breast Cancer Primary Screening Referral',
  fijibreastprimaryreferral: 'Cervical Cancer Primary Screening Referral',
};

const FIELD_TO_NAME = {
  date: 'Date',
  screened: 'Total screened',
  screenedMale: 'Total screened by male',
  screenedFemale: 'Total screened by female',
  'screened<30': 'Total screened by <30 years',
  'screened>30': 'Total screened by >30 years',
  screenedItaukei: 'Total screened by Itaukei',
  screenedIndian: 'Total screened by Fijian of Indian descent',
  screenedOther: 'Total screened by other ethnicity',
  'screenedRisk<5': 'Total screened by CVD risk <5% (%)',
  'screenedRisk5-10': 'Total screened by CVD risk 5% to <10% (%)',
  'screenedRisk10-20': 'Total screened by CVD risk 10% to <20% (%)',
  'screenedRisk20-30': 'Total screened by CVD risk 20% to <30% (%)',
  'screenedRisk>30': 'Total screened by CVD risk ≥30% (%)',
  referredPercent: 'Total referred (%)',
  referredMale: 'Total referred by male',
  referredFemale: 'Total referred by female',
  'referred<30': 'Total referred by <30 years',
  'referred>30': 'Total referred by >30 years',
  referredItaukei: 'Total referred by Itaukei',
  referredIndian: 'Total referred by Fijian of Indian descent',
  referredOther: 'Total referred by other ethnicity',
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

const getSurveyResponses = async (models, parameters) => {
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
    where: parametersToEncounterSqlWhere(parameters),
    order: [['startDate', 'ASC']],
  });
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

export const dataGenerator = async (models, parameters = {}) => {
  const encounters = await getEncounters(models, parameters);

  const reportData = encounters.map(transformDataPoint);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'Encounter';
