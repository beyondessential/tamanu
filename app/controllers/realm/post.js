const { has, set } = require('lodash');
const shortId = require('shortid');
const { objectToJSON } = require('../../utils');

module.exports = (req, res) => {
  const { body, path } = req;
  const realm = req.app.get('database');
  const table = path.replace('/', '');

  try {
    if (!has(body, '_id')) set(body, '_id', shortId.generate());
    return realm.write(() => {
      const result = realm.create(table, body);
      return res.json(objectToJSON(result));
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
