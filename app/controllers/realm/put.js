const { has, set } = require('lodash');
const shortId = require('shortid');
const { objectToJSON } = require('../../utils');

module.exports = (req, res) => {
  const realm = req.app.get('realm');
  const { body, params } = req;
  const { model, id } = params;

  try {
    if (id) set(body, '_id', id);
    if (!has(body, '_id')) set(body, '_id', shortId.generate());
    return realm.write(() => {
      const result = realm.create(model, body, true);
      return res.json(objectToJSON(result));
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
