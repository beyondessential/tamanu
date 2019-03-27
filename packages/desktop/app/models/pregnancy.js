import Backbone from 'backbone-associations';
import { defaults, clone } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Pregnancy', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/pregnancy`,
  defaults: () => defaults({
    conceiveDate: Date, // estimated
    deliveryDate: Date, // estimated
    child: '',
    father: '', // biological father
    outcome: '',
    gestationalAge: '',
    surveyResponses: [],
  },
  BaseModel.prototype.defaults),

  relations: [
    {
      type: Backbone.One,
      key: 'child',
      relatedModel: require('./patient'),
    },
    {
      type: Backbone.One,
      key: 'father',
      relatedModel: require('./patient'),
    },
    {
      type: Backbone.Many,
      key: 'surveyResponses',
      relatedModel: () => require('./surveyResponse'),
    },
    ...BaseModel.prototype.relations,
  ],

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  },
}));
