const jsonPrune = require('json-prune');
const { schemas } = require('../schemas');
const parseObject = require('./parse-object');

const jsonParse = (object) => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};

const findSchema = (type) => schemas.find(schema => schema.name === type);

module.exports = { jsonParse, findSchema, ...parseObject };
