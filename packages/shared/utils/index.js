const { each, isArray } = require('lodash');
const jsonPrune = require('json-prune');
const { schemas } = require('../schemas');

const jsonParse = (object) => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};

const objectToJSON = (object, deep = true) => {
  try {
    if (isArray(object) && deep) return object.map(obj => objectToJSON(obj));
    const jsonObject = jsonParse(object);
    if (typeof object.objectSchema === 'function') {
      const { properties } = object.objectSchema();
      each(properties, (props, key) => {
        if (key !== 'objectsFullySynced' && (props.type === 'list' || props.type === 'linkingObjects')) {
          jsonObject[key] = objectToJSON(Array.from(object[key]), props.type === 'list');
        }
        if (key === 'objectsFullySynced') jsonObject[key] = Array.from(object[key]);
      });
    }
    return jsonObject;
  } catch (err) {
    throw new Error(err);
  }
};

const findSchema = (type) => {
  return schemas.find(schema => schema.name === type);
}

module.exports = { objectToJSON, jsonParse, findSchema };
