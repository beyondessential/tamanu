import { defaults } from 'lodash';
import * as Yup from 'yup';
import BaseModel from './base';
import { register } from './register';

export default register('Allergy', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/allergy`,
  defaults: () => defaults({
    name: null,
    icd9CMCode: null,
    icd10Code: null,
  }, BaseModel.prototype.defaults),

  validationSchema: Yup.object().shape({
    name: Yup.mixed().required('is required'),
  }),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
