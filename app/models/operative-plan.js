const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `operative_plan_${_id}`,
      type: 'operative_plan',
      additionalNotes: null,
      admissionInstructions: null,
      caseComplexity: null,
      operationDescription: null,
      procedures: [],
      status: null,
      surgeon: null,

      // Associations
      diagnoses: '',
      patient: '',
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
