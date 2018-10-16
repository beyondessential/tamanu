import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/surveyScreenComponent`,
  defaults: () => defaults({
      _id: shortid.generate(),
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
      relatedModel: require('./question'),
      // map: (values) => mapRelations(values, require('./question')),
      // serialize: '_id'
    }
  ],
});
