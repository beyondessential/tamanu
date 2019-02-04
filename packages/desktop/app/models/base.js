import Backbone from 'backbone-associations';
import moment from 'moment';
import jsonDiff from 'json-diff';
import shortid from 'shortid';
import {
  isString, assignIn, isEmpty, clone, each,
  set, isObject, has, head, isArray
} from 'lodash';
import { to } from 'await-to-js';
import { concatSelf } from '../utils';
import { store } from '../store';

export default Backbone.AssociatedModel.extend({
  urlRoot: `${process.env.HOST}${process.env.REALM_PATH}`,
  idAttribute: '_id',
  lastSyncedAttributes: {},

  constructor(attributes, options) {
    let newAttributes = clone(attributes);
    if (isArray(newAttributes)) newAttributes = head(newAttributes);
    // if (!isEmpty(newAttributes) && has(newAttributes, '_id')) this.lastSyncedAttributes = newAttributes;
    Backbone.AssociatedModel.apply(this, [newAttributes, options]);
    this._parseParents();
  },

  defaults: {
    modifiedFields: [],
    createdBy: null,
    createdAt: moment(),
    modifiedBy: '',
    modifiedAt: null,
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'modifiedFields',
      relatedModel: () => require('./modifiedField'),
      // serialize: '_id'
    }, {
      type: Backbone.One,
      key: 'createdBy',
      relatedModel: () => require('./user'),
      serialize: '_id',
    }, {
      type: Backbone.One,
      key: 'modifiedBy',
      relatedModel: () => require('./user'),
      serialize: '_id'
    },
  ],

  /**
   * Override backbone's default fetch method to record `lastSyncedAttributes`
   * @param {object} options Options sent to XHR request
   */
  async fetch(options) {
    try {
      const res = await Backbone.Model.prototype.fetch.apply(this, [options]);
      this.lastSyncedAttributes =  this.toJSON();
      this._parseParents();
      return res;
    } catch (err) {
      console.error(`Error: ${err}`);
      return Promise.reject(err);
    }
  },

  /**
   * Override backbone's default save method to record `modifiedFields` and `lastSyncedAttributes`
   * @param {object} attrs Attributes to be patched
   * @param {object} options Options sent to XHR request
   */
  async save(attrs = {}, options = {}) {
    try {
      const ModifiedFieldModel = require('./modifiedField');
      const { auth } = store.getState();
      let { secret } = auth;
      secret = btoa(secret);

      // let attributes = attrs || {};
      if (!isEmpty(attrs)) this.set(attrs, { silent: true });
      const { attributes } = this;
      let modifiedAttributes = {};
      const defaultAttributes = this.defaults() || this.defaults;
      if (this.isNew()) this.lastSyncedAttributes = defaultAttributes;

      let modifiedFields = jsonDiff.diff(this.lastSyncedAttributes, this.toJSON());
      modifiedFields = Object.keys(modifiedFields).map(field => field.split('__')[0]);

      // Set last modified times
      modifiedAttributes = this._setModifiedFields({ modifiedFields, defaultAttributes, attributes, ModifiedFieldModel, secret, modifiedAttributes });

      // Use match method for instead of PUT
      if (!this.isNew()) options.patch = true;

      // Proxy the call to the original save function
      const res = await Backbone.Model.prototype.save.apply(this, [modifiedAttributes, options]);
      this.lastSyncedAttributes = this.toJSON();
      return res;
    } catch (err) {
      console.error(`Error: ${err}`);
      return Promise.reject(err);
    }
  },

  _setModifiedFields({ modifiedFields, defaultAttributes, attributes, ModifiedFieldModel, secret, modifiedAttributes }) {
    let modifiedAttributesNew = modifiedAttributes;

    // if modified field is a default attribute
    if (modifiedFields && has(defaultAttributes, 'modifiedFields')) {
      let { modifiedFields: originalModifiedFields } = attributes;
      if (!originalModifiedFields) {
        originalModifiedFields = [];
      }

      modifiedFields.forEach(key => {
        if (has(defaultAttributes, key)) {
          const _id = `${this.id || shortid.generate()}-${key}`;
          const _model = new ModifiedFieldModel({
            _id,
            token: secret,
            field: key,
            time: new Date().getTime()
          });
          originalModifiedFields.set([_model], { remove: false });
          // Set new value
          let value = this.get(key);
          if (value && typeof value.toJSON === 'function')
            value = value.toJSON();
          modifiedAttributesNew[key] = value;
        }
      });

      modifiedAttributesNew = { ...modifiedAttributesNew, modifiedFields: originalModifiedFields };
    } else if (!has(defaultAttributes, 'modifiedFields')) {
      modifiedAttributesNew = attributes;
    }
    return modifiedAttributesNew;
  },


  toJSON() {
    const json = Backbone.AssociatedModel.prototype.toJSON.call(this);
    each(json, (field, key) => {
      if (field instanceof moment) json[key] = field.format();
    });
    return json;
  },

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
        const model = this.attributes[relation.key];
        if (model) {
          const [err] = await to(model.fetch());
          if (err) return reject(err);
        }
        return resolve();
      }
    });
  },

  _parseParents() {
    const parents = [];
    if (typeof this.reverseRelations === 'object') {
      const reverse = this.reverseRelations;
      reverse.forEach(({ key, model: Model }) => {
        if (!parents[key]) parents[key] = [];
        if (has(this.attributes, key) && this.attributes[key]) {
          concatSelf(parents[key], this.attributes[key].map(record => new Model(record)));
        }
      });
    }

    this.parents = parents;
  }
});
