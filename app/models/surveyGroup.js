import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyGroup_${shortid.generate()}`,
      docType: 'surveyGroup',
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
