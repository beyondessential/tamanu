import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `allergy_${shortid.generate()}`,
      type: 'allergy',
      name: null,
      icd9CMCode: null,
      icd10Code: null,
    },
    BaseModel.prototype.defaults,
  ),

  relations: [{
    type: Backbone.One,
    key: 'patient',
    relatedModel: () => require('./patient'),
    map: (obj) => {
      console.log('-obj-', obj);
    }
  }]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
