const { head, isEmpty } = require('lodash');

module.exports = (req, res) => {
  const realm = req.app.get('realm');
  const { params } = req;
  const { model, id } = params;

  try {
    return realm.write(() => {
      const objects = realm.objects(model);
      const object = head(objects.filtered(`_id = '${id}'`));
      if (isEmpty(object)) return res.status(404).end();
      realm.delete(object);
      return res.status(200).json({});
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
