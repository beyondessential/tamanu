import Backbone from 'backbone-associations';
import moment from 'moment';
import { isEmpty } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/condition`,
  defaults: () => ({
    date: moment(),
    condition: null,
    diagnosis: null,
    ...BaseModel.prototype.defaults,
  }),
  ignoreRequestKeys: ['diagnosis'],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'diagnosis',
      model: require('./diagnosis'),
    },
  ],

  parse(res) {
    return { ...res, date: moment(res.date) };
  },

  validate(attrs) {
    const errors = [];
    if (isEmpty(attrs.condition)) errors.push('condition is required!');
    if (!moment(attrs.date).isValid()) errors.push('date is required!');
    if (!isEmpty(errors)) return errors;
  },
});
