import { MedicationModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: MedicationModel,
  url: `${BaseCollection.prototype.url}/medication`
});
