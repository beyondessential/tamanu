const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `lab_${_id}`,
      type: 'lab',
      labDate: Date,
      notes: null,
      requestedBy: null,
      requestedDate: Date,
      result: null,
      status: null,

      // Associations
      labType: '',
      patient: '',
      visit: ''
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
