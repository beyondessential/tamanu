import * as Yup from 'yup';
import BaseModel from './base';
import { register } from './register';

export default register('ProcedureMedication', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/procedureMedication`,
  defaults: () => ({
    medication: '',
    quantity: '',
    ...BaseModel.prototype.defaults,
  }),

  validationSchema: Yup.object().shape({
    medication: Yup.mixed().required('is required'),
    quantity: Yup.mixed().required('is required'),
  }),
}));
