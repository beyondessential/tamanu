import Backbone from 'backbone-associations';
import * as Yup from 'yup';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register(
  'OperationReport',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/operationReport`,
    defaults: () => ({
      ...BaseModel.prototype.defaults,
      additionalNotes: null,
      caseComplexity: null,
      actionsTaken: [],
      operationDescription: null,
      surgeon: null,
      assistant: null,
      surgeryDate: moment(),
      preOpDiagnoses: [],
      postOpDiagnoses: [],
    }),

    // Associations
    relations: [
      {
        type: Backbone.Many,
        key: 'preOpDiagnoses',
        relatedModel: 'Diagnosis',
      },
      {
        type: Backbone.Many,
        key: 'postOpDiagnoses',
        relatedModel: 'Diagnosis',
      },
      ...BaseModel.prototype.relations,
    ],

    reverseRelations: [
      {
        type: Backbone.Many,
        key: 'visits',
        model: 'Visit',
      },
    ],

    validationSchema: Yup.object().shape({
      surgeryDate: Yup.date().required('is required'),
      surgeon: Yup.string().required('is required'),
    }),
  }),
);
