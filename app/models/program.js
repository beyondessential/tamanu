import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/program`,
  defaults: () => defaults({
      // _id: shortid.generate(),
      name: null,
      programType: 'direct',
      surveys: []
    },
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'surveys',
      relatedModel: () => require('./survey'),
      // map: (values) => mapRelations(values, require('./survey')),
      // serialize: '_id',
      collectionType: require('../collections/surveys'),
    }
  ],

  getSurvey(surveyId) {
    const { surveys } = this.attributes;
    return surveys.models.find(model => model.id === surveyId);
  }

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
