import defaults from './defaults';

export const ProgramSchema = {
  name: 'program',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    programType: {
      type: 'string',
      default: 'direct',
      indexed: true,
    },
    collection: 'string?',
    label: 'string?',
    value: 'string?',
    patientFilters: 'string?',
    surveys: {
      type: 'list',
      objectType: 'survey',
    },
    ...defaults,
  },
};
