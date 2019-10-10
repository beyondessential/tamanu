import { has, set, find, isFunction } from 'lodash';
import shortId from 'shortid';
import { schemas } from 'Shared/schemas';
import { objectToJSON } from '../../utils';
import { ENVIRONMENT_TYPE } from '../../constants';

export default function(req, res) {
  let { body } = req;
  const { db, params } = req;
  const { model, id } = params;

  try {
    if (id) set(body, '_id', id);
    if (!has(body, '_id')) set(body, '_id', shortId.generate());
    // Find schema
    const schema = find(schemas, ({ name }) => name === model);
    if (!schema) return res.status(500).send('Schema not found');
    if (isFunction(schema.beforeSave)) body = schema.beforeSave(db, body, ENVIRONMENT_TYPE.LAN);
    return db.write(() => {
      const result = db.create(model, body, true);
      return res.json(objectToJSON(result));
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
}
