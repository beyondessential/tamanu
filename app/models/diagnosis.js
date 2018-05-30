import shortid from 'shortid';
import { extend } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => extend(
    BaseModel.prototype.defaults,
    {
      _id: `diagnosis_${shortid.generate()}`,
      type: 'diagnosis',
      active: true,
      date: Date,
      diagnosis: null,
      secondaryDiagnosis: false
    }
  )
});
