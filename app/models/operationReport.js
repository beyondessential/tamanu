import Backbone from 'backbone-associations';
import shortid from 'shortid';
import mapRelations from '../utils/map-relations';
import BaseModel from './base';

export default BaseModel.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `opReport_${_id}`,
      docType: 'opReport',
      additionalNotes: null,
      caseComplexity: null,
      procedures: [],
      operationDescription: null,
      surgeon: null,
      surgeryDate: Date,
      preOpDiagnoses: [],
      postOpDiagnoses: [],
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'preOpDiagnoses',
      relatedModel: require('./diagnosis'),
      map: (values) => mapRelations(values, require('./diagnosis')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'postOpDiagnoses',
      relatedModel: require('./diagnosis'),
      map: (values) => mapRelations(values, require('./diagnosis')),
      serialize: '_id'
    }
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
