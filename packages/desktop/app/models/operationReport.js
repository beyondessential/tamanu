import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('OperationReport', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/operationReport`,
  defaults: () => defaults({
    additionalNotes: null,
    caseComplexity: null,
    procedures: [],
    operationDescription: null,
    surgeon: null,
    surgeryDate: Date,
    preOpDiagnoses: [],
    postOpDiagnoses: [],
  },
  BaseModel.prototype.defaults),

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

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
