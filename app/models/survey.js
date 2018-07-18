import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `survey_${shortid.generate()}`,
      docType: 'survey',
      name: null,
      code: null,
      imageData: null,
      permissionGroupId: null,
      surveyGroupId: null,
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
