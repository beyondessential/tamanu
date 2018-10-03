import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults, clone } from 'lodash';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/pregnancy`,
  defaults: () => defaults({
      conceiveDate: Date, // estimated
      deliveryDate: Date, // estimated
      child: '',
      father: '', // biological father
      outcome: '',
      gestationalAge: '',
      surveyResponses: [],
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'child',
      relatedModel: require('./patient'),
      map: (values) => mapRelations(values, require('./patient')),
      serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'father',
      relatedModel: require('./patient'),
      map: (values) => mapRelations(values, require('./patient')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'surveyResponses',
      relatedModel: () => require('./surveyResponse'),
      map: (values) => mapRelations(values, require('./surveyResponse')),
      serialize: '_id'
    },
  ],

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  }
});
