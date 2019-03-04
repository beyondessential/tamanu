import { LabRequestModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: LabRequestModel,
  url: `${BaseCollection.prototype.url}/labRequest`,
});
