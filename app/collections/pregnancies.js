import { PregnancyModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: PregnancyModel,
  url: `${BaseCollection.prototype.url}/pregnancy`
});
