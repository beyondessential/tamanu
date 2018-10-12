const { objectToJSON } = require('../../utils');

module.exports = (req, res) => {
  const realm = req.app.get('database');
  const { params } = req;
  const { model, id } = params;

  try {
    return realm.write(() => {
      let objects = realm.objects(model);
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        objects = objectToJSON(objects[0]);
        return res.json(objects);
      }

      objects = objects.map(object => objectToJSON(object));
      return res.json(objects);
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
