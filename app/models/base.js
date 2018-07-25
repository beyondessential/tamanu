import Backbone from 'backbone-associations';
import moment from 'moment';
import { mapValues, assignIn, isEmpty, clone, map, set } from 'lodash';
import { to } from 'await-to-js';

export default Backbone.AssociatedModel.extend({
  idAttribute: '_id',

  defaults: {
    modifiedFields: {},
    createdAt: moment(),
    modifiedAt: null,
  },

  async save(attrs, options) {
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
    const res = await Backbone.Model.prototype.save.apply(this, [attrs, options]);
    return res;
  },

  fetch(options) {
    return new Promise(async (resolve, reject) => {
      const { relations } = this;
      if (!options) options = {};
      // Proxy the call to the original save function
      const [error, res] = await to(Backbone.Model.prototype.fetch.apply(this, [options]));
      if (error) return reject(error);
      // Fetch all the relations
      if (options.relations && !isEmpty(relations)) {
        try {
          const tasks = relations.map((relation) => this.fetchRelations({ relation }));
          await Promise.all(tasks);
          setTimeout(() => this.trigger('change'), 100);
          resolve(res);
        } catch (err) {
          reject(err);
        }
      } else {
        setTimeout(() => this.trigger('change'), 100);
        resolve(res);
      }
    });
  },

  fetchRelations(options) { //
    return new Promise(async (resolve, reject) => {
      const { relation } = options;
      const { type } = relation;
      // Fetch the models
      if (type === 'Many') {
        const { models } = this.attributes[relation.key];
        if (models.length > 0) {
          const tasks = models.map(model => model.fetch({ relations: true }));
          try {
            await Promise.all(tasks);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          resolve();
        }
      } else {
        const model = this.attributes[relation.key];
        const [err] = await to(model.fetch());
        if (err) return reject(err);
        return resolve();
      }
    });
  },

  // toJSON() {
  //   const attributes = clone(this.attributes);
  //   const { relations } = this;
  //   if (!isEmpty(relations)) {
  //     relations.forEach((relation) => {
  //       const relationCol = this.get(relation.key);
  //       if (typeof relationCol !== 'undefined') {
  //         if (relation.type === 'Many') {
  //           const data = relationCol.models.map((m) => m.toJSON());
  //           console.log('__data__', data);
  //           this.set(relation.key, data);
  //         } else if (relation.type === 'One') {
  //           const { id } = relationCol;
  //           this.set(relation.key, id);
  //         } else {
  //           throw new Error('Invalid relation type!');
  //         }
  //       }
  //     });
  //   }

  //   return attributes;
  // },
});
