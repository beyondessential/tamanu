import * as schemas from './schemas';
import defaults from './defaults';

const version = 47;
const schemaClasses = [];
Object.values(schemas).forEach(({ name, properties }) => {
  schemaClasses[name] = class {
    constructor() {
      Object.keys(properties).forEach(key => {
        this[key] = properties[key];
      });
    }
  };
  Object.defineProperty(schemaClasses[name], 'name', { value: name });
});

export {
  schemas, version, schemaClasses, defaults,
};
