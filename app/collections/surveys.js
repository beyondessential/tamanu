import Backbone from 'backbone';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: require('../models/survey'),
  comparator: 'order',
  url: `${BaseCollection.prototype.url}/survey`
});
