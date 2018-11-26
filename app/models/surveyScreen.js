import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/surveyScreen`,
  defaults: () => defaults({
      surveyId: null,
      screenNumber: null,
      components: []
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    // {
    //   type: Backbone.One,
    //   key: 'surveyId',
    //   relatedModel: require('./survey'),
    //   // map: (values) => mapRelations(values, require('./survey')),
    //   // serialize: '_id'
    // },
    {
      type: Backbone.Many,
      key: 'components',
      relatedModel: require('./surveyScreenComponent'),
      // map: (values) => mapRelations(values, require('./surveyScreenComponent')),
      // serialize: '_id'
    }
  ],
});
