import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { extend } from 'lodash';
import BaseModel from './base';

console.log('backbone-associations', Backbone);

export default BaseModel.extend({
  defaults: () => extend(
    BaseModel.prototype.defaults,
    {
      _id: `allergy_${shortid.generate()}`,
      type: 'allergy',
      name: null,
      icd9CMCode: null,
      icd10Code: null,
    }
  ),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
