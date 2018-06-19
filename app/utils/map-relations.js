import { isEmpty, uniq, filter, isArray, every, has } from 'lodash';

export default (objs, Model) => {
  if (isEmpty(objs)) return objs;
  if (objs instanceof Model) return objs;
  if (has(objs, '_id')) return objs;

  if (isArray(objs)) {
    if (every(objs, (v) => v instanceof Model)) return objs;

    // const ids = filter(uniq(map(objs, '_id')), obj => { return typeof obj !== 'undefined'; });
    const ids = filter(uniq(objs), id => { return typeof id !== 'undefined'; });
    const _return = [];
    ids.forEach((_id) => {
      const _model = new Model();
      _model.set({ _id });
      _model.fetch();
      _return.push(_model);
    });

    return _return;
  }

  return objs;

  // const _model = new Model();
  // _model.set({ _id: objs._id });
  // // _model.fetch();
  // return _model;
};
