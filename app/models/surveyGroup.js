import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyGrp_${shortid.generate()}`,
      docType: 'surveyGrp',
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
