const {
  isArray, isObject, each, pull, pick,
} = require('lodash');
const jsonPrune = require('json-prune');

const internals = {};
const _parseProperty = ({
  props, isParentObject, key, forSync, object,
}) => {
  if (['linkingObjects', 'list', 'object'].includes(props.type) && isParentObject) {
    const valueToParse = (props.type === 'object' ? object[key] : Array.from(object[key]));
    return internals.parseToJSON(valueToParse, {
      deep: props.type === 'list',
      isParentObject: false,
      forSync,
    });
  }

  return null;
};

internals.parseToJSON = (object, {
  deep = true,
  forSync = false,
  isParentObject = true,
} = {}) => {
  if (!object) return null;
  try {
    if (isArray(object) && deep) {
      return internals.arrayToJSON(object, { deep, isParentObject, forSync });
    }

    let requiredFields = [];
    const jsonObject = JSON.parse(jsonPrune(object));
    if (typeof object.objectSchema === 'function') {
      const { properties } = object.objectSchema();
      each(properties, (props, key) => {
        if (props.optional === false || isParentObject) {
          requiredFields.push(key);
        }
        // remove `list` and `linkingObjects` types
        if ((forSync && !isParentObject) && ['linkingObjects', 'list'].includes(props.type)) {
          requiredFields = pull(requiredFields, key);
        }
        // only include required fields without parent links
        const newValue = _parseProperty({
          props, isParentObject, key, forSync, object,
        });
        if (newValue) jsonObject[key] = newValue;
      });
    }

    if (forSync) {
      return pick(jsonObject, requiredFields);
    }
    return jsonObject;
  } catch (err) {
    throw new Error(err);
  }
};

internals.arrayToJSON = (array, props = {}) => array.map((value) => {
  if (isObject(value)) {
    return internals.parseToJSON(value, props);
  }
  return value;
});

internals.objectToJSON = (object) => internals.parseToJSON(object);

internals.parseObjectForSync = (object) => internals.parseToJSON(object, { forSync: true });

module.exports = internals;
