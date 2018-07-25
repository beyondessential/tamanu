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
      question: '',
      componentNumber: null,
      nswersEnablingFollowUp: null,
      isFollowUp: false,
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'question',
      relatedModel: require('./question'),
      map: (values) => mapRelations(values, require('./question')),
      serialize: '_id'
    }
  ],
});
