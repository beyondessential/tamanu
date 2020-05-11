import defaults from './defaults';

export const PatientAllergySchema = {
  name: 'patientAllergy',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    allergy: 'allergy',
    notes: 'string?',
    practitioner: 'user?',
    ...defaults,
  },
};
