import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register('OperationReport', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/operationReport`,
  defaults: () => defaults({
    additionalNotes: null,
    caseComplexity: null,
    actionsTaken: [],
    operationDescription: null,
    surgeon: null,
    surgeryDate: moment(),
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

  reverseRelations: [
    {
      type: Backbone.Many,
      key: 'visits',
      model: 'Visit',
    },
  ],

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
