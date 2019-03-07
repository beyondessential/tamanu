const jsonPrune = require('json-prune');

const jsonParse = (object, maxDepth) => {
  try {
    return JSON.parse(jsonPrune(object, maxDepth), (key, value) => {
      let valueInString = JSON.stringify(value);
      valueInString = valueInString.replace(/{}/g, '[]');
      let newValue = JSON.parse(valueInString);

      if (valueInString.substr(0, 5) === '{"0":') {
        newValue = Object.values(newValue);
        return newValue;
      }

      return newValue;
    });
  } catch (err) {
    throw err;
  }
};

const objectToJSON = (object, maxDepth = 5) => jsonParse(object, maxDepth);

module.exports = { objectToJSON };
