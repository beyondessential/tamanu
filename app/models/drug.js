import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `drug_${shortid.generate()}`,
      docType: 'drug',
      name: '',
      code: '',
      unit: '',
    },
    BaseModel.prototype.defaults,
  ),
});
