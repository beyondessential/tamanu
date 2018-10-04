const { each, isArray } = require('lodash');

const objectToJSON = (object) => {
  if (isArray(object)) return object.map(obj => objectToJSON(obj));
  const jsonObject = JSON.parse(JSON.stringify(object));
  const { properties } = object.objectSchema();
  each(properties, (props, key) => {
    if (props.type === 'list') jsonObject[key] = objectToJSON(Array.from(object[key]));
  });
  return jsonObject;
};

module.exports = { objectToJSON };
