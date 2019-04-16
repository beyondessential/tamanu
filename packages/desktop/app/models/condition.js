import Backbone from 'backbone-associations';
import moment from 'moment';
import * as Yup from 'yup';

import BaseModel from './base';
import { register } from './register';

export default register('Condition', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/condition`,
  defaults: () => ({
    date: moment(),
    condition: null,
    diagnosis: null,
    ...BaseModel.prototype.defaults,
  }),
  ignoreRequestKeys: ['diagnosis'],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'diagnosis',
      model: 'Diagnosis',
    },
  ],

  parse(res) {
    return { ...res, date: moment(res.date) };
  },

  validationSchema: Yup.object().shape({
    name: Yup.mixed().required('is required'),
  }),
}));
