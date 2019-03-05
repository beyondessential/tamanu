import { ImagingRequestModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: ImagingRequestModel,
  url: `${BaseCollection.prototype.url}/imagingRequest`,
});
