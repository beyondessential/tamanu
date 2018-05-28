const Backbone = require('backbone-associations');
const shortid = require('shortid');
const { VisitModel } = require('./index');

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
      visits: [],
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: VisitModel
    }
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
