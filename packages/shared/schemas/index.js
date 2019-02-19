const fs = require('fs');
const path = require('path');
const { each } = require('lodash');
const defaults = require('./defaults');
const { SYNC_MODES } = require('../constants');
const version = 35;
const defaultSchema = {
  primaryKey: '_id',
  sync: SYNC_MODES.ON,
  properties: {}
};

const schemas = [];
const schemaClasses = [];
fs.readdirSync(__dirname).forEach((file) => {
  if (file === 'index.js' || file === 'defaults.js') return;
  const schema = require(path.join(__dirname, file));
  schemas.push({ ...defaultSchema, ...schema });
  schemaClasses[schema.name] = class {
    constructor(props){
      each(props, (value, key) => this[key] = value);
    }
  };
  Object.defineProperty(schemaClasses[schema.name], 'name', { value: schema.name })
});

module.exports = { schemas, schemaClasses, version, defaults };
