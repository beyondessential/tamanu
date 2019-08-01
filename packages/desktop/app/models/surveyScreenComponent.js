import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import { register } from './register';

export default register(
  'SurveyScreenComponent',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/surveyScreenComponent`,
    defaults: () =>
      defaults(
        {
          question: '',
          componentNumber: null,
          answersEnablingFollowUp: null,
          isFollowUp: false,
        },
        BaseModel.prototype.defaults,
      ),

    relations: [
      {
        type: Backbone.One,
        key: 'question',
        relatedModel: 'Question',
      },
      ...BaseModel.prototype.relations,
    ],
  }),
);
