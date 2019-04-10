import Backbone from 'backbone-associations';
import {
  pick, set, each, isObject, difference,
} from 'lodash';
import { getClient, history, notify } from '.';
import { AUTH_LOGOUT } from '../actions/types';

export default (store) => {
  const originalSyncFunc = Backbone.sync;
  Backbone.Model.prototype.idAttribute = '_id';
  Backbone.sync = (method, model, options = {}) => {
    const newError = () => (xhr, textStatus, error) => {
      errorHandler({ xhr, textStatus, error });
      return originalError(xhr, textStatus, error);
    };

    const getOptions = () => {
      let { headers } = options;
      headers = { ...headers, ...getHeaders() };
      return { ...options, headers };
    };

    const getHeaders = () => ({ Authorization: `Basic ${encodeCredentials()}` });

    const encodeCredentials = () => {
      const clientId = getClient();
      const { auth } = store.getState();
      const { secret } = auth;

      return btoa(unescape(encodeURIComponent([clientId, secret].join(':'))));
    };

    const errorHandler = ({ xhr }) => {
      const { status } = xhr;
      // 500 - Server error
      if (status === 500) {
        notify('Something went wrong while processing your request, please try again later.');
      }
      // 401 - Unauthorized
      if (status === 401) {
        store.dispatch({ type: AUTH_LOGOUT });
        return history.push('/login');
      }
      // 405 - Not enough permissions
      if (status === 405) {
        notify("You don't have enough permissions to make this request!");
        if (method === 'read') return history.goBack();
      }
      // 404 - Not found
      if (status === 404) {
        notify('Object not found!');
        return history.push('/');
      }
    };

    const newOptions = getOptions(options);
    const { error: originalError } = newOptions;
    newOptions.error = newError();

    if (method === 'create' || method === 'patch') {
      let { attrs } = options;
      attrs = pickDefaults.call(model, (attrs || model.toJSON()));
      newOptions.attrs = attrs;
    }

    return originalSyncFunc.call(model, method, model, newOptions);
  };

  // Add promise support to backbone model
  const originalSave = Backbone.Model.prototype.save;
  Backbone.Model.prototype.save = function saveData(data, options) {
    return new Promise(async (resolve, reject) => {
      const { auth } = store.getState();
      const { userId } = auth;
      const dataFiltered = pickDefaults.call(this, data);

      // Add created / modified by
      const user = { _id: userId };
      if (userId && this.isNew()) dataFiltered.createdBy = user;
      if (userId) dataFiltered.modifiedBy = user;

      // Fix relations
      each(dataFiltered, (value, field) => {
        if (field === 'modifiedFields' || field === 'objectsFullySynced') return;
        if (Array.isArray(value)) {
          if (isObject(value[0])) { // is collection
            const newValue = value.map(({ _id }) => ({ _id }));
            set(dataFiltered, field, newValue);
          }
        } else if (isObject(value)) { // is object
          set(dataFiltered, field, pick(value, ['_id']));
        }
      });

      const newOptions = {
        ...options,
        wait: true,
        success: resolve,
        error: reject,
      };

      const sent = originalSave.apply(this, [dataFiltered, newOptions]);
      // In some cases the save method will not dispatch a request at all - for eg
      // if validation fails. This means the success/error functions in the options
      // object will never be called -- so we check for a falsy return value and
      // reject manually.
      if (!sent) {
        reject(this.validationError);
      }
    });
  };

  const originalFetch = Backbone.Model.prototype.fetch;
  Backbone.Model.prototype.fetch = function fetchData(options) {
    return new Promise((resolve, reject) => {
      const newOptions = {
        ...options,
        success: resolve,
        error: reject,
      };

      originalFetch.apply(this, [newOptions]);
    });
  };

  const originalDestroy = Backbone.Model.prototype.destroy;
  Backbone.Model.prototype.destroy = function destroyData(options) {
    return new Promise((resolve, reject) => {
      const newOptions = {
        ...options,
        wait: true,
        success: resolve,
        error: reject,
      };

      originalDestroy.apply(this, [newOptions]);
    });
  };
};

function pickDefaults(data) {
  const defaults = this.defaults() || this.defaults;
  const ignoreRequestKeys = this.ignoreRequestKeys || [];
  const modelKeys = difference(Object.keys(defaults), ignoreRequestKeys);
  return pick(data, modelKeys);
}
