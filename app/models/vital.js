const Backbone = require('backbone');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `vital_${_id}`,
      type: 'vital',
      dateRecorded: Date,
      dbp: null,
      heartRate: null,
      height: null,
      respiratoryRate: null,
      sbp: null,
      temperature: null,
      weight: null,
    };
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
