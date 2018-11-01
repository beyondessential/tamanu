import { DrugModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: DrugModel,
  url: `${BaseCollection.prototype.url}/drug`,
  filters: {
    fields: ['name', 'code']
  }
});
