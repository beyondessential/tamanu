const Backbone = require('backbone-associations');
const moment = require('moment');
const { mapValues, assignIn } = require('lodash');

export default Backbone.Model.extend({
  idAttribute: '_id',

  defaults: {
    modifiedFields: [],
    createdAt: moment(),
    modifiedAt: null,
  },

  save(attrs, options) {
    console.log('_this_', this, this.attributes);
    // Set last modified times
    if (this.changedAttributes() !== false) {
      let modifiedFields = this.changedAttributes();
      modifiedFields = mapValues(modifiedFields, () => moment());
      modifiedFields = assignIn(this.attributes.modifiedFields, modifiedFields);

      this.set({
        modifiedFields,
        modifiedAt: moment(),
      });
    }

    // Proxy the call to the original save function
    Backbone.Model.prototype.save.call(this, attrs, options);
  }
});
