import Backbone from 'backbone-associations';
import { MedicationModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: MedicationModel,
  url: `${BaseCollection.prototype.url}/medication`,
});
