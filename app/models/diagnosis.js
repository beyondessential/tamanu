const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `diagnosis_${_id}`,
      type: 'diagnosis',
      active: true,
      date: Date,
      diagnosis: null,
      secondaryDiagnosis: false
    };
  }
});
