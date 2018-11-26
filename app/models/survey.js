import { defaults, isObject, concat, chain, pick } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/survey`,
  defaults: () => defaults({
      name: null,
      code: null,
      imageData: null,
      permissionGroupId: null,
      surveyGroupId: null,
      screens: [],
      canRedo: false, // Can submit multiple times
      order: 0
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    // {
    //   type: Backbone.One,
    //   key: 'surveyGroupId',
    //   relatedModel: require('./surveyGroup'),
    //   // map: (values) => mapRelations(values, require('./surveyGroup')),
    //   // serialize: '_id'
    // },
    {
      type: Backbone.Many,
      key: 'screens',
      relatedModel: require('./surveyScreen'),
      // map: (values) => mapRelations(values, require('./surveyScreen')),
      // serialize: '_id'
    }
  ],

  getQuestions(screenIndex) {
    const { screens } = this.attributes;
    let questions = [];
    const screen = screens.at(screenIndex);
    if (isObject(screen)) {
      const { components } = screen.attributes;
      questions = components.models.map(component => component.get('question'));
    }
    return questions;
  },

  getTotalScreens() {
    return this.attributes.screens.length;
  },

  getHeaders() {
    const { screens } = this.attributes;
    let allQuestions = [];
    screens.forEach(screen => {
      const { components } = screen.attributes;
      allQuestions = concat(
        allQuestions,
        chain(components.models)
          .map(component => component.get('question'))
          .filter(question => question.isHeader())
          .mapKeys((value, key) => (key === 'indicator' ? 'text' : key))
          .map(question => pick(question.toJSON(), ['text', '_id']))
          .value()
      );
    });
    return allQuestions;
  }
});
