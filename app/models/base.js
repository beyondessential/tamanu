import Backbone from 'backbone-associations';
import moment from 'moment';
import jsonDiff from 'json-diff';
import { isString, assignIn, isEmpty, clone, each, set, isObject, has, head, isArray } from 'lodash';
import { to } from 'await-to-js';
import { concatSelf } from '../utils';

export default Backbone.AssociatedModel.extend({
  idAttribute: '_id',
  lastSyncedAttributes: {},
  // urlRoot: process.env.LAN_REALM,

  constructor(attributes, options) {
    if (isArray(attributes)) attributes = head(attributes);
    if (!isEmpty(attributes) && has(attributes, '_id')) this.lastSyncedAttributes = attributes;
    Backbone.AssociatedModel.apply(this, [attributes, options]);
  },

  defaults: {
    modifiedFields: {},
    createdAt: moment(),
    modifiedAt: null,
  },

  /**
   * Override backbone's default fetch method to record `lastSyncedAttributes`
   * @param {object} options Options sent to XHR request
   */
  async fetch(options) {
    try {
      const res = await Backbone.Model.prototype.fetch.apply(this, [options]);
      this.lastSyncedAttributes = this.toJSON();
      return res;
    } catch (err) {
      console.error(err);
      return this.previousAttributes();
    }
  },

  /**
   * Override backbone's default save method to record `modifiedFields` and `lastSyncedAttributes`
   * @param {object} attrs Attributes to be patched
   * @param {object} options Options sent to XHR request
   */
  async save(attrs = {}, options = {}) {
    try {
      let attributes = attrs || {};
      if (!this.isNew()) attributes = {};
      let modifiedFields = jsonDiff.diff(this.lastSyncedAttributes, this.toJSON());

      // Set last modified times
      if (modifiedFields) {
        let originalModified = {};
        if (this.attributes.modifiedFields !== '' && isString(this.attributes.modifiedFields))
          originalModified = JSON.parse(this.attributes.modifiedFields);

        each(modifiedFields, (_, key) => {
          if (has(this.defaults(), key)) {
            modifiedFields[key] = new Date().getTime();
            if (!this.isNew()) {
              let value = this.get(key);
              if (value.toJSON) value = value.toJSON();
              attributes[key] = value;
            }
          } else {
            delete modifiedFields[key];
          }
        })
        modifiedFields = assignIn(originalModified, modifiedFields);
        modifiedFields = JSON.stringify(modifiedFields);
        attributes = Object.assign(attributes, {
          modifiedFields,
          modifiedAt: moment(),
        });
      }

      // Use match method for instead of PUT
      if (!this.isNew()) options.patch = true;

      // Proxy the call to the original save function
      const res = await Backbone.Model.prototype.save.apply(this, [attributes, options]);
      this.lastSyncedAttributes = this.toJSON();
      return res;
    } catch (err) {
      console.error(err);
      return this.previousAttributes();
    }
  },

  // fetch(options) {
  //   return new Promise(async (resolve, reject) => {
  //     const { relations } = this;
  //     if (!options) options = {};
  //     // Proxy the call to the original save function
  //     const [error, res] = await to(Backbone.Model.prototype.fetch.apply(this, [options]));
  //     if (error) return reject(error);
  //     // Fetch all the relations
  //     if (options.relations && !isEmpty(relations)) {
  //       try {
  //         const tasks = relations.map((relation) => {
  //           if ((isArray(options.relations) && options.relations.includes(relation.key)) || options.relations === true)
  //             return this.fetchRelations(Object.assign({ relation, deep: true }, options));
  //         });
  //         await Promise.all(tasks);
  //         setTimeout(() => this.trigger('change'), 100);
  //         resolve(res);
  //       } catch (err) {
  //         reject(err);
  //       }
  //     } else {
  //       setTimeout(() => this.trigger('change'), 100);
  //       resolve(res);
  //     }
  //   });
  // },

  fetchRelations(options) { //
    return new Promise(async (resolve, reject) => {
      const { relation } = options;
      const { type } = relation;
      // Fetch the models
      if (type === 'Many') {
        const { models } = this.attributes[relation.key];
        if (models.length > 0) {
          const tasks = models.map(model => model.fetch({ relations: options.deep }));
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
        // console.log({ type }, relation.key, this.attributes[relation.key]);
        const model = this.attributes[relation.key];
        if (model) {
          const [err] = await to(model.fetch());
          if (err) return reject(err);
        }
        return resolve();
      }
    });
  },

  toJSON() {
    const attributes = clone(this.attributes);

    // Convert dated to string
    each(attributes, (value, key) => {
      if (value instanceof moment) attributes[key] = value.toISOString();
    })

    // Add relations
    const { relations } = this;
    if (!isEmpty(relations)) {
      relations.forEach((relation) => {
        const relationCol = this.get(relation.key);
        if (typeof relationCol !== 'undefined' && isObject(relationCol)) {
          if (relation.type === 'Many') {
            const data = relationCol.models.map((m) => m.toJSON());
            set(attributes, relation.key, data);
          } else if (relation.type === 'One') {
            const { id } = relationCol;
            set(attributes, relation.key, relationCol.toJSON());
          } else {
            throw new Error('Invalid relation type!');
          }
        }
      });
    }
    return attributes;
  }
});
