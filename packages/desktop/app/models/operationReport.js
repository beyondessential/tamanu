import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/operationReport`,
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
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'preOpDiagnoses',
      relatedModel: require('./diagnosis'),
    },
    {
      type: Backbone.Many,
      key: 'postOpDiagnoses',
      relatedModel: require('./diagnosis'),
    },
    ...BaseModel.prototype.relations
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
