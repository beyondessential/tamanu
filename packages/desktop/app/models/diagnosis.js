import { defaults, clone } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/diagnosis`,
  defaults: () => defaults({
      active: true,
      date: Date,
      diagnosis: null,
      secondaryDiagnosis: false
    },
    BaseModel.prototype.defaults,
  ),

  cloneAttributes() {
    const attributes = clone(this.attributes);
    delete attributes._id;
    delete attributes._rev;
    delete attributes.modifiedFields;
    return attributes;
  }
});
