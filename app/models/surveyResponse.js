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
      surveyId: null,
      patientId: null,
      userId: null,
      assessorName: null,
      startTime: null,
      endTime: null,
      metadata: null,
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'surveyId',
      relatedModel: require('./survey'),
      map: (values) => mapRelations(values, require('./survey')),
      serialize: '_id'
    }
  ],
});
