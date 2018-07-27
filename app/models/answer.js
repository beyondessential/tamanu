import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `answer_${shortid.generate()}`,
      docType: 'answer',
      type: '',
      questionId: '',
      body: '',
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.Many,
      key: 'answers',
      relatedModel: require('./question'),
      map: (values) => mapRelations(values, require('./question')),
      serialize: '_id'
    }
  ],
});
