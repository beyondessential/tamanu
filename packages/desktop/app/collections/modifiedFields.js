import { ModifiedFieldModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: ModifiedFieldModel,
  url: `${BaseCollection.prototype.url}/modifiedField`,
});
