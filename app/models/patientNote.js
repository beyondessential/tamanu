const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `note_${_id}`,
      docType: 'note',
      attribution: null,
      content: null,
      createdBy: null,
      date: Date,
      /* custom list of noteTypes of mixins/patient-note-types */
      noteType: null
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
