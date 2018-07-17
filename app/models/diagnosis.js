import shortid from 'shortid';
import { defaults, clone } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `diagnosis_${shortid.generate()}`,
      docType: 'diagnosis',
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
