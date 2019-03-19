import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/surveyResponse`,
  defaults: () => defaults({
    surveyId: '',
    patientId: '',
    userId: '',
    moduleType: '',
    moduleId: '',
    assessorName: '',
    startTime: '',
    endTime: '',
    metadata: '',
    answers: [],
  },
  BaseModel.prototype.defaults),

  relations: [
    {
      type: Backbone.Many,
      key: 'answers',
      relatedModel: require('./answer'),
    },
    ...BaseModel.prototype.relations,
  ],
});
