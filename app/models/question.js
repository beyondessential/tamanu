import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `question_${shortid.generate()}`,
      docType: 'question',
      test: null,
      indicator: null,
      imageData: null,
      type: null,
      options: [],
      code: null,
      details: null,
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'surveyGroupId',
      relatedModel: require('./surveyGroup'),
      map: (values) => mapRelations(values, require('./surveyGroup')),
      serialize: '_id'
    }
  ],
});
