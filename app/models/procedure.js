const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `procedure_${_id}`,
      docType: 'procedure',
      anesthesiaType: null,
      anesthesiologist: null,
      assistant: null,
      description: null,
      cptCode: null,
      location: null,
      notes: null,
      physician: null,
      procedureDate: Date,
      timeStarted: null,
      timeEnded: null,

      // Associations
      // visit: ''
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
