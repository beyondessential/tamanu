import { LabTestTypeModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: LabTestTypeModel,
  url: `${BaseCollection.prototype.url}/labTestType`,
});
