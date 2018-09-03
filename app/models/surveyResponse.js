import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyResponse_${shortid.generate()}`,
      docType: 'surveyResponse',
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
      map: (values) => mapRelations(values, require('./answer')),
      serialize: '_id'
    },
    // {
    //   type: Backbone.One,
    //   key: 'surveyId',
    //   relatedModel: require('./survey'),
    //   map: (values) => mapRelations(values, require('./survey')),
    //   serialize: '_id'
    // },
    // {
    //   type: Backbone.One,
    //   key: 'patientId',
    //   relatedModel: require('./patient'),
    //   map: (values) => mapRelations(values, require('./patient')),
    //   serialize: '_id'
    // }
  ],
});
