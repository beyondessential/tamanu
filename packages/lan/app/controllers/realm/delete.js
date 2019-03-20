import { head, isEmpty } from 'lodash';

export default function (req, res) {
  const realm = req.app.get('database');
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
    console.error(err);
    return res.status(500).send(err.toString());
  }
}
