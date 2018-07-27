import shortid from 'shortid';
import { defaults, isObject } from 'lodash';
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
      screens: []
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    // {
    //   type: Backbone.One,
    //   key: 'surveyGroupId',
    //   relatedModel: require('./surveyGroup'),
    //   map: (values) => mapRelations(values, require('./surveyGroup')),
    //   serialize: '_id'
    // },
    {
      type: Backbone.Many,
      key: 'screens',
      relatedModel: require('./surveyScreen'),
      map: (values) => mapRelations(values, require('./surveyScreen')),
      serialize: '_id'
    }
  ],

  getQuestions(screenIndex) {
    const { screens } = this.attributes;
    let questions = [];
    const screen = screens.at(screenIndex);
    if (isObject(screen)) {
      const { components } = screen.attributes;
      questions = components.models.map(component => component.get('question').toJSON());
    }
    return questions;
  },

  getTotalScreens() {
    return this.attributes.screens.length;
  }
});
