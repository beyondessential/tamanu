import * as schemaObjects from './schemas';
import defaults from './defaults';
import { SYNC_MODES } from '../constants';

const defaultSchema = {
  primaryKey: '_id',
  sync: SYNC_MODES.ON,
  properties: {},
};
const schemas = Object.values(schemaObjects).map(schema => ({ ...defaultSchema, ...schema }));
const version = 61;
const schemaClasses = [];
schemas.forEach(({ name, properties }) => {
  schemaClasses[name] = class {
    constructor() {
      Object.keys(properties).forEach(key => {
        this[key] = properties[key];
      });
    }
  };
  Object.defineProperty(schemaClasses[name], 'name', { value: name });
});

export { schemas, version, schemaClasses, defaults };
