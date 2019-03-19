const {
  isObject, pull, pick,
} = require('lodash');
const jsonPrune = require('json-prune');
const parseProperty = ({
  props, isParentObject, key, forSync, object,
}) => {
  if (['linkingObjects', 'list', 'object'].includes(props.type) && isParentObject) {
    const valueToParse = (props.type === 'object' ? object[key] : Array.from(object[key]));
    return parseToJSON(valueToParse, {
      deep: props.type === 'list',
      isParentObject: false,
      forSync,
    });
  }

  return null;
};

export const parseToJSON = (object, {
  deep = true,
  forSync = false,
  isParentObject = true,
} = {}) => {
  if (!object) return null;
  try {
    if (Array.isArray(object) && deep) {
      return arrayToJSON(object, { deep, isParentObject, forSync });
    }

    let requiredFields = [];
    const jsonObject = JSON.parse(jsonPrune(object));
    if (typeof object.objectSchema === 'function') {
      const { properties } = object.objectSchema();
      properties.forEach((props, key) => {
        if (props.optional === false || isParentObject) {
          requiredFields.push(key);
        }
        // remove `list` and `linkingObjects` types
        if ((forSync && !isParentObject) && ['linkingObjects', 'list'].includes(props.type)) {
          requiredFields = pull(requiredFields, key);
        }
        // only include required fields without parent links
        const newValue = parseProperty({
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

export const arrayToJSON = (array, props = {}) => array.map((value) => {
  if (isObject(value)) {
    return parseToJSON(value, props);
  }
  return value;
});

export const objectToJSON = (object) => parseToJSON(object);

export const parseObjectForSync = (object) => parseToJSON(object, { forSync: true });
