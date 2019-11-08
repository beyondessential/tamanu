import defaults from './defaults';

export const ProcedureTypeSchema = {
  name: 'procedureType',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    code: 'string',
    name: 'string',
    ...defaults,
  },
};
