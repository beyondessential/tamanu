import Backbone from 'backbone-associations';
import moment from 'moment';
import shortid from 'shortid';
import jsonPrune from 'json-prune';

import {
  isEmpty, clone, each, has, head, isArray,
} from 'lodash';
import { concatSelf, getModifiedFieldNames } from '../utils';
import { store } from '../store';
import { ModifiedFieldsCollection } from '../collections';
import { getModel } from './register';

const MAX_NESTED_COMPARE = 5;

export default Backbone.AssociatedModel.extend({
  urlRoot: `${process.env.HOST}${process.env.REALM_PATH}`,
  idAttribute: '_id',
  lastSyncedAttributes: {},

  constructor(attributes, options) {
    let newAttributes = clone(attributes);
    if (isArray(newAttributes)) newAttributes = head(newAttributes);
    Backbone.AssociatedModel.apply(this, [newAttributes, options]);
    this.parseParents();
  },

  defaults: {
    modifiedFields: [],
    createdBy: null,
    createdAt: moment(),
    modifiedBy: '',
    modifiedAt: null,
  },

  // set for fields that will be ignored during a HTTP request
  // can be used to define some local fields that would never be sent to the server
  ignoreRequestKeys: new Set(),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'modifiedFields',
      relatedModel: 'ModifiedField',
    }, {
      type: Backbone.One,
      key: 'createdBy',
      relatedModel: 'User',
      serialize: '_id',
    }, {
      type: Backbone.One,
      key: 'modifiedBy',
      relatedModel: 'User',
      serialize: '_id',
    },
  ],

  /**
   * This method sets the last synced attributes
   * Last synced attributes are used to maintain modified fields
   * This is a workaround as Backbone's default change detection only works with Model.set()
   */
  setLastSyncedAttributes() {
    // prune JSON to MAX_NESTED_COMPARE levels
    this.lastSyncedAttributes = JSON.parse(jsonPrune(this.toJSON(), MAX_NESTED_COMPARE));
  },

  /**
   * Override backbone's default fetch method to record `lastSyncedAttributes`
   * @param {object} options Options sent to XHR request
   */
  async fetch(options) {
    try {
      const res = await Backbone.AssociatedModel.prototype.fetch.apply(this, [options]);
      this.setLastSyncedAttributes();
      this.parseParents();
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
      const originalSave = Backbone.AssociatedModel.prototype.save;
      if (!isEmpty(attrs)) this.set(attrs, { silent: true });
      const defaultAttributes = this.defaults() || this.defaults;
      if (this.isNew()) this.lastSyncedAttributes = defaultAttributes;

      const modifiedFields = getModifiedFieldNames(this.lastSyncedAttributes, this.toJSON());
      // Set last modified timestamps
      const modifiedAttributes = this.setModifiedFields(modifiedFields);

      // call original save method with modified attributes
      const response = await originalSave.apply(this, [modifiedAttributes, { ...options, patch: true }]);
      this.setLastSyncedAttributes();
      return response;
    } catch (err) {
      console.error(`Error: ${err}`);
      return Promise.reject(err);
    }
  },

  /**
   * This method iterates through modified fields and returns
   * a new object with only the modified attributes and a collection
   * of all modified fields with updated timestamps and a JWT token each
   * @param {*} modifiedFields Array of modified keys
   */
  setModifiedFields(modifiedFields) {
    // get user's secret
    const { auth } = store.getState();
    let { secret } = auth;
    secret = btoa(secret);

    const ModifiedFieldModel = getModel('ModifiedField');
    const { attributes } = this;
    const defaultAttributes = this.defaults() || this.defaults;
    const modifiedAttributes = {};

    // if modified field is a default attribute
    if (modifiedFields && has(defaultAttributes, 'modifiedFields')) {
      let { modifiedFields: originalModifiedFields } = attributes; // cache current modified fields
      if (!originalModifiedFields) {
        originalModifiedFields = new ModifiedFieldsCollection();
      }

      modifiedFields.forEach(key => {
        if (has(defaultAttributes, key)) {
          // overwrite existing keys
          const existingModifiedField = originalModifiedFields.findWhere({ field: key });
          if (existingModifiedField) {
            existingModifiedField.set({
              token: secret,
              time: new Date().getTime(),
            });
          } else {
            const modifiedFieldsModel = new ModifiedFieldModel({
              _id: `${this.id || shortid.generate()}-${key}`,
              token: secret,
              field: key,
              time: new Date().getTime(),
            });
            originalModifiedFields.set([modifiedFieldsModel], { remove: false });
          }
          // Set new value
          let value = this.get(key);
          if (value && typeof value.toJSON === 'function') value = value.toJSON();
          modifiedAttributes[key] = value;
        }
      });

      // add modified fields
      modifiedAttributes.modifiedFields = originalModifiedFields;
      return modifiedAttributes;
    } else if (!has(defaultAttributes, 'modifiedFields')) {
      return attributes;
    }

    return {};
  },

  toJSON() {
    const json = Backbone.AssociatedModel.prototype.toJSON.call(this);
    each(json, (field, key) => {
      if (field instanceof moment) json[key] = field.format();
    });
    return json;
  },

  /**
   * This method is used to parse model's parents after a HTTP request
   * Parent(s) are mounted to the Model.parents attribute
   */
  parseParents() {
    const parents = [];
    const { attributes } = this;
    if (typeof this.reverseRelations === 'object') {
      const reverse = this.reverseRelations;
      reverse.forEach(({ type, key, model }) => {
        const Model = getModel(model.default ? model.default : model);
        switch (type) {
          default:
          case Backbone.Many: {
            if (!parents[key]) parents[key] = [];
            const attribute = attributes[key];
            if (attribute && Array.isArray(attribute)) {
              concatSelf(parents[key], attribute.map(record => new Model(record)));
            }
            break;
          }
          case Backbone.One:
            if (!parents[key]) parents[key] = {};
            if (has(attributes, key) && attributes[key]) {
              const modelsAttributes = Array.isArray(attributes[key]) ? attributes[key][0] : attributes[key];
              parents[key] = new Model(modelsAttributes);
            }
            break;
        }
      });
    }

    this.parents = parents;
  },
});
