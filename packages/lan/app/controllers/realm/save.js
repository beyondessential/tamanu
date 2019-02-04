const { has, set, find, isFunction } = require('lodash');
const shortId = require('shortid');
const { objectToJSON } = require('../../utils');
const { schemas } = require('../../../../shared/schemas');
const { ENVIRONMENT_TYPE } = require('../../constants');

module.exports = (req, res) => {
  const realm = req.app.get('database');
  let { body } = req;
  const { params } = req;
  const { model, id } = params;

  try {
    if (id) set(body, '_id', id);
    if (!has(body, '_id')) set(body, '_id', shortId.generate());
    // Find schema
    const schema = find(schemas, ({ name }) => name === model);
    if (!schema) return res.status(500).send('Schema not found');
    if (isFunction(schema.beforeSave)) body = schema.beforeSave(realm, body, ENVIRONMENT_TYPE.LAN);
    return realm.write(() => {
      const result = realm.create(model, body, true);
      return res.json(objectToJSON(result));
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
};
