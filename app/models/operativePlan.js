const Backbone = require('backbone-associations');
const shortid = require('shortid');
const { DiagnosisModel } = require('./index');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `opPlan_${_id}`,
      type: 'opPlan',
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
      relatedModel: DiagnosisModel
    }
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
