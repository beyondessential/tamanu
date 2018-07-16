import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyGrp_${shortid.generate()}`,
      type: 'surveyGrp',
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
