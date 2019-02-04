const { each, isArray } = require('lodash');
const jsonPrune = require('json-prune');

const jsonParse = (object) => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};

const objectToJSON = (object, depp = true) => {
  try {
    if (isArray(object) && depp) return object.map(obj => objectToJSON(obj));
    const jsonObject = jsonParse(object);
    if (typeof object.objectSchema === 'function') {
      const { properties } = object.objectSchema();
      each(properties, (props, key) => {
        if (props.type === 'list' || props.type === 'linkingObjects') jsonObject[key] = objectToJSON(Array.from(object[key]), props.type === 'list');
      });
    }
    return jsonObject;
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = { objectToJSON };
