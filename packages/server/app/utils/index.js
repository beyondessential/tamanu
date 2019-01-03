const { each, isArray } = require('lodash');
const jsonPrune = require('json-prune');
const { incoming } = require('./faye-extensions');

const objectToJSON = (object, depp = true) => {
  try {
    if (isArray(object) && depp) return object.map(obj => objectToJSON(obj));
    const jsonObject = JSON.parse(jsonPrune(object));
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

module.exports = { objectToJSON, incoming };
