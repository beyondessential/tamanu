import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyScreenComponent_${shortid.generate()}`,
      docType: 'surveyScreenComponent',
      questionId: null,
      screenId: null,
      componentNumber: null,
      nswersEnablingFollowUp: null,
      isFollowUp: false,
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'questionId',
      relatedModel: require('./question'),
      map: (values) => mapRelations(values, require('./question')),
      serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'screenId',
      relatedModel: require('./surveyScreen'),
      map: (values) => mapRelations(values, require('./surveyScreen')),
      serialize: '_id'
    }
  ],
});
