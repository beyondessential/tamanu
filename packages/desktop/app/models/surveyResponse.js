import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import { register } from './register';

export default register(
  'SurveyResponse',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/surveyResponse`,
    defaults: () =>
      defaults(
        {
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
        BaseModel.prototype.defaults,
      ),

    relations: [
      {
        type: Backbone.Many,
        key: 'answers',
        relatedModel: 'Answer',
      },
      ...BaseModel.prototype.relations,
    ],
  }),
);
