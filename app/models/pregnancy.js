import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults, clone } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `pregnancy_${shortid.generate()}`,
      type: 'pregnancy',
      conceiveDate: Date, // estimated
      deliveryDate: Date, // estimated
      child: '',
      father: '', // biological father
      outcome: '',
      gestationalAge: ''
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'child',
      relatedModel: require('./patient'),
      serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'father',
      relatedModel: require('./patient'),
      serialize: '_id'
    }
  ],

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  }
});
