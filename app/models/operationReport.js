const Backbone = require('backbone-associations');
const shortid = require('shortid');
const { DiagnosisModel } = require('./index');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `opReport_${_id}`,
      type: 'opReport',
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
      relatedModel: DiagnosisModel
    },
    {
      type: Backbone.Many,
      key: 'postOpDiagnoses',
      relatedModel: DiagnosisModel
    }
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
