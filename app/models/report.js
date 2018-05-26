const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `report_${_id}`,
      type: 'report',
      reportDate: Date,
      reportType: null,

      // Associations
      visit: ''
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
