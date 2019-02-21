import { TestModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: TestModel,
  url: `${BaseCollection.prototype.url}/test`,
});
