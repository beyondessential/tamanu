import Backbone from 'backbone';
import { defaults, clone, isEmpty } from 'lodash';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/diagnosis`,
  defaults: () => defaults({
      active: true,
      date: moment(),
      diagnosis: null,
      secondaryDiagnosis: false,
      condition: null,
      certainty: null
    },
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'condition',
      relatedModel: () => require('./condition'),
    },
    ...BaseModel.prototype.relations
  ],

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  },

  parse(res) {
    return { ...res, date: moment(res.date) };
  },

  validate(attrs) {
    const errors = [];
    if (isEmpty(attrs.diagnosis)) errors.push('diagnosis is required!');
    if (!moment(attrs.date).isValid()) errors.push('date is required!');
    if (isEmpty(attrs.certainty)) errors.push('certainty is required!');
    if (!isEmpty(errors)) return errors;
  },
});
