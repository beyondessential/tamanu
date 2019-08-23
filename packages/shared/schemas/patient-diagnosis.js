import defaults from './defaults';

export const PatientDiagnosisSchema = {
  name: 'patientDiagnosis',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    diagnosis: 'diagnosis',
    certainty: 'string', // suspected or confirmed
    isPrimary: 'bool',
    ...defaults,
  },
};
