import Backbone from 'backbone-associations';
import * as Yup from 'yup';
import BaseModel from './base';
import { register } from './register';

export default register(
  'OperativePlan',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/operativePlan`,
    defaults: () => ({
      ...BaseModel.prototype.defaults,
      additionalNotes: null,
      admissionInstructions: null,
      caseComplexity: null,
      operationDescription: null,
      actionsTaken: [],
      status: '',
      surgeon: null,
      diagnoses: [],
    }),

    // Associations
    relations: [
      {
        type: Backbone.Many,
        key: 'diagnoses',
        relatedModel: 'Diagnosis',
      },
      ...BaseModel.prototype.relations,
    ],

    reverseRelations: [
      {
        type: Backbone.One,
        key: 'visit',
        model: 'Visit',
      },
    ],

    getVisit() {
      return this.parents.visit;
    },

    validationSchema: Yup.object().shape({
      operationDescription: Yup.string().required('is required'),
      surgeon: Yup.string().required('is required'),
      status: Yup.mixed().required('is required'),
    }),
  }),
);
