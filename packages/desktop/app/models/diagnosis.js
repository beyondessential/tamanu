import Backbone from 'backbone-associations';
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
      certainty: null,
      condition: null
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'diagnosis',
      relatedModel: () => require('./diagnosisList'),
    }, {
      type: Backbone.One,
      key: 'condition',
      relatedModel: () => require('./condition'),
    },
    ...BaseModel.prototype.relations
  ],

  hasOngoingCondition() {
    const { condition } = this.toJSON();
    return !isEmpty(condition);
  },

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  },

  parse(response) {
    return { ...response, date: moment(response.date) };
  },

  validate(attributes) {
    const errors = [];
    if (isEmpty(attributes.diagnosis)) errors.push('diagnosis is required!');
    if (!moment(attributes.date).isValid()) errors.push('date is required!');
    if (isEmpty(attributes.certainty)) errors.push('certainty is required!');
    if (!isEmpty(errors)) return errors;
  },
});
