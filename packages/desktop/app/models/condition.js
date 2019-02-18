import Backbone from 'backbone-associations';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/condition`,
  defaults: () => ({
    date: moment(),
    condition: null,
    diagnosis: null,
    ...BaseModel.prototype.defaults
  }),
  ignoreRequestKeys: ['diagnosis'],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'diagnosis',
      model: require('./diagnosis')
    }
  ],
});
