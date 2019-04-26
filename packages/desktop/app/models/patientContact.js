import { defaults } from 'lodash';
import * as Yup from 'yup';
import BaseModel from './base';
import { register } from './register';

export default register('PatientContact', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/patientContact`,
  defaults: () => defaults({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  },
  BaseModel.prototype.defaults),

  validationSchema: Yup.object().shape({
    name: Yup.mixed().required('is required'),
    phone: Yup.mixed().required('is required'),
  }),
}));
