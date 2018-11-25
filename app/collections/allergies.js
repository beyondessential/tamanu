import { AllergyModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: AllergyModel,
  url: `${BaseCollection.prototype.url}/allergy`
});
