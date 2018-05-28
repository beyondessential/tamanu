const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `medication_${_id}`,
      type: 'medication',
      notes: null,
      prescription: null,
      prescriptionDate: Date,
      quantity: null,
      refills: null,
      requestedDate: Date,
      requestedBy: null,
      status: null,
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
