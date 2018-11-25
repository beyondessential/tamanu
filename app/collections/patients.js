import { PatientModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: PatientModel,
  url: `${BaseCollection.prototype.url}/patient`,
  filters: {
    fields: ['firstName', 'lastName', 'displayId']
  }
});
