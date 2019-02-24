import { LabTestModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: LabTestModel,
  url: `${BaseCollection.prototype.url}/labTest`,
});
