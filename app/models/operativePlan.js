import Backbone from 'backbone-associations';
import shortid from 'shortid';
import mapRelations from '../utils/map-relations';
import BaseModel from './base';

export default BaseModel.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `opPlan_${_id}`,
      docType: 'opPlan',
      additionalNotes: null,
      admissionInstructions: null,
      caseComplexity: null,
      operationDescription: null,
      procedures: [],
      status: null,
      surgeon: null,
      diagnoses: [],
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'diagnoses',
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
