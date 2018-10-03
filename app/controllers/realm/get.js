module.exports = (req, res) => {
  const { body, path } = req;
  const realm = req.app.get('realm');
  const table = path.replace('/', '');

  try {
    realm.write(() => {
      let objects = realm.objects(table);
      objects = objects.map(object => JSON.parse(JSON.stringify(object)));
      return res.json(objects);
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
