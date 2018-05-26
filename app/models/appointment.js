const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `appointment_${_id}`,
      type: 'appointment',
      allDay: true,
      provider: '',
      location: '',
      appointmentType: '',
      startDate: Date,
      endDate: Date,
      notes: '',
      status: 'Scheduled',

      // Associations
      patient: '',
      visits: ''
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
