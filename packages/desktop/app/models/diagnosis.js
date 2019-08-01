import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register(
  'Diagnosis',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/diagnosis`,
    defaults: () =>
      defaults(
        {
          name: '',
          code: '',
        },
        BaseModel.prototype.defaults,
      ),
  }),
);
