import Backbone from 'backbone-associations';
import * as Yup from 'yup';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register('Procedure', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/procedure`,
  defaults: () => ({
    ...BaseModel.prototype.defaults,
    anesthesiaType: '',
    anesthesiologist: '',
    assistant: '',
    description: '',
    cptCode: '',
    location: '',
    notes: '',
    physician: '',
    procedureDate: moment(),
    timeStarted: '',
    timeEnded: '',

    medication: [],
  }),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'medication',
      relatedModel: 'ProcedureMedication',
    },
    ...BaseModel.prototype.relations,
  ],

  validationSchema: Yup.object().shape({
    description: Yup.string().required('is required'),
    procedureDate: Yup.string().required('is required'),
    physician: Yup.string().required('is required'),
  }),
}));
