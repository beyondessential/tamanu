const { each, isArray } = require('lodash');
const jsonPrune = require('json-prune');

const jsonParse = (object) => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};

let currentDepth = 0;
const objectToJSON = (object, depp = true, maxDepth = 3, internalCall = false) => {
  try {
    currentDepth = internalCall ? currentDepth + 1 : 0;
    if (isArray(object) && depp) {
      return object.map(obj => objectToJSON(obj, true, maxDepth, true));
    }

    const jsonObject = jsonParse(object);
    if (typeof object.objectSchema === 'function') {
      const { properties } = object.objectSchema();
      each(properties, (props, key) => {
        if (props.type === 'list' || props.type === 'linkingObjects') {
          jsonObject[key] = objectToJSON(Array.from(object[key]), (currentDepth <= maxDepth), maxDepth, true);
        }
      });
    }
    return jsonObject;
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = { objectToJSON };
