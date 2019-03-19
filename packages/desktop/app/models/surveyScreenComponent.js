import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/surveyScreenComponent`,
  defaults: () => defaults({
    question: '',
    componentNumber: null,
    answersEnablingFollowUp: null,
    isFollowUp: false,
  },
  BaseModel.prototype.defaults),

  relations: [
    {
      type: Backbone.One,
      key: 'question',
      relatedModel: require('./question'),
    },
    ...BaseModel.prototype.relations,
  ],
});
