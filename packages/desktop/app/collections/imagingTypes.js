import { ImagingTypeModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: ImagingTypeModel,
  url: `${BaseCollection.prototype.url}/imagingType`,
});
