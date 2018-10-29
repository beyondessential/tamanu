const { each, isArray } = require('lodash');
const { incoming } = require('./faye-extensions');

const objectToJSON = (object) => {
  if (isArray(object)) return object.map(obj => objectToJSON(obj));
  const jsonObject = JSON.parse(JSON.stringify(object));
  if (typeof object.objectSchema === 'function') {
    const { properties } = object.objectSchema();
    each(properties, (props, key) => {
      if (props.type === 'list') jsonObject[key] = objectToJSON(Array.from(object[key]));
    });
  }
  return jsonObject;
};

module.exports = { objectToJSON, incoming };
