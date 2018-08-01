import Backbone from 'backbone';

export default Backbone.Collection.extend({
  model: require('../models/survey'),
  comparator: 'order',
});
