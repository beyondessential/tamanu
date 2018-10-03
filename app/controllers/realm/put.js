module.exports = (req, res) => {
  const { body, path } = req;
  const realm = req.app.get('realm');
  const table = path.replace('/', '');

  try {
    realm.write(() => {
      realm.create(table, body);
    });
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
