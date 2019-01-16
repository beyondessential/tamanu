import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/surveyResponse`,
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
      answers: []
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.Many,
      key: 'answers',
      relatedModel: require('./answer'),
      // map: (values) => mapRelations(values, require('./answer')),
      // serialize: '_id'
    },
    // {
    //   type: Backbone.One,
    //   key: 'surveyId',
    //   relatedModel: require('./survey'),
    //   // map: (values) => mapRelations(values, require('./survey')),
    //   // serialize: '_id'
    // },
    // {
    //   type: Backbone.One,
    //   key: 'patientId',
    //   relatedModel: require('./patient'),
    //   // map: (values) => mapRelations(values, require('./patient')),
    //   // serialize: '_id'
    // }
  ],
});
