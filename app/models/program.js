import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `program_${shortid.generate()}`,
      docType: 'program',
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
      map: (values) => mapRelations(values, require('./survey')),
      serialize: '_id'
    }
  ],

  getAvailableSurveys() {
    console.log('_getAvailableSurveys_');
    return this.get('surveys').toJSON();
  },

  getCompletedSurveys() {
    console.log('_getCompletedSurveys_');
    return [];
  }

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
