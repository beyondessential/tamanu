import { AppointmentModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: AppointmentModel,
  url: `${BaseCollection.prototype.url}/appointment`,
  state: {
    sortKey: 'startDate',
    order: 1,
    ...BaseCollection.prototype.state
  }
});
