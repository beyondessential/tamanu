import LabRequestModel from '../models/labRequest';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: LabRequestModel,
  url: `${BaseCollection.prototype.url}/labRequest`,
  comparator: ({ attributes: { requestedByA } }, { attributes: { requestedByB } }) =>
    new Date(requestedByA) - new Date(requestedByB),
});
