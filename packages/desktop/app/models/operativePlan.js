import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/operationPlan`,
  defaults: () => defaults({
    additionalNotes: null,
    admissionInstructions: null,
    caseComplexity: null,
    operationDescription: null,
    procedures: [],
    status: null,
    surgeon: null,
    diagnoses: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: require('./diagnosis'),
    },
    ...BaseModel.prototype.relations
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
