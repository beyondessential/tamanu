import getRoute from './get';
import saveRoute from './save';
import deleteRoute from './delete';

export default {
  GET: getRoute,
  PUT: saveRoute,
  POST: saveRoute,
  PATCH: saveRoute,
  DELETE: deleteRoute,
};
