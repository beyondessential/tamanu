import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('OperativePlan', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/operativePlan`,
  defaults: () => defaults({
    additionalNotes: null,
    admissionInstructions: null,
    caseComplexity: null,
    operationDescription: null,
    actionsTaken: [],
    status: null,
    surgeon: null,
    diagnoses: [],
  }, BaseModel.prototype.defaults),

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

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
