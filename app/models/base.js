import Backbone from 'backbone-associations';
import moment from 'moment';
import { mapValues, assignIn, isEmpty, clone } from 'lodash';

export default Backbone.AssociatedModel.extend({
  idAttribute: '_id',

  defaults: {
    modifiedFields: [],
    createdAt: moment(),
    modifiedAt: null,
  },

  save(attrs, options) {
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
  },

  toJSON(options) {
    if (options.relations) {
      return new Promise((resolve, reject) => {
        const attributes = clone(this.attributes);
        const { relations } = this;

        // Fetch all the relations
        if (!isEmpty(relations)) {
          relations.forEach((relation) => {
            const Model = relation.relatedModel();
            attributes[relation.key] = [];

            // Fetch the models
            const models = this.get(relation.key);
            if (models.length > 0) {
              const tasks = [];

              models.forEach((_model) => {
                const _m = new Model();
                _m.set({ _id: _model.id });
                tasks.push(_m.fetch());
              });

              Promise.all(tasks).then((values) => {
                attributes[relation.key] = values;
                resolve(attributes);
              }).catch((err) => reject(err));
            }
          });
        } else {
          resolve(attributes);
        }
      });
    }

    return clone(this.attributes);
  }
});
