import BaseCollection from './base';

export default BaseCollection.extend({
  model: 'Survey',
  comparator: 'order',
  url: `${BaseCollection.prototype.url}/survey`,
});
