import Backbone from 'backbone-associations';
import { pick, set, isArray, each, isObject, difference } from 'lodash';
import { getClient, history, notify } from '.';
import { AUTH_LOGOUT } from '../actions/types';

export default (store) => {
  const originalSyncFunc = Backbone.sync;
  Backbone.Model.prototype.idAttribute = '_id';
  Backbone.sync = (method, model, options={}) => {
    const _newError = () =>
      (xhr, textStatus, error) => {
        _errorHandler({ xhr, textStatus, error });
        return originalError(xhr, textStatus, error);
      }

    const _getOptions = () => {
      let { headers } = options;
      headers = { ...headers, ..._getHeaders() };
      return { ...options, headers };
    }

    const _getHeaders = () => ({ 'Authorization': `Basic ${_encodeCredentials()}` });

    const _encodeCredentials = () => {
      const clientId = getClient();
      const { auth } = store.getState();
      const { secret } = auth;

      return btoa(unescape(encodeURIComponent([clientId, secret].join(':'))));
    };

    const _errorHandler = ({ xhr }) => {
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

    const newOptions = _getOptions(options);
    const { error: originalError } = newOptions;
    newOptions.error = _newError();

    if (method === 'create' || method === 'patch') {
      let { attrs } = options;
      attrs = _pickDefaults.call(model, (attrs || model.toJSON()));
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
      const dataFiltered = _pickDefaults.call(this, data);

      // Add created / modified by
      const user = { _id: userId };
      if (userId && this.isNew()) dataFiltered.createdBy = user;
      if (userId) dataFiltered.modifiedBy = user;

      // Fix relations
      each(dataFiltered, (value, field) => {
        if (field === 'modifiedFields' || field === 'objectsFullySynced') return;
        if (isArray(value)) {
          const newValue = value.map(({ _id }) => ({ _id }))
          set(dataFiltered, field, newValue);
        } else if (isObject(value)) {
          set(dataFiltered, field, pick(value, ['_id']));
        }
      });
      const newOptions = {
        ...options,
        wait: true,
        success: resolve,
        error: reject
      };

      originalSave.apply(this, [dataFiltered, newOptions]);
    })
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
        error: reject
      };

      originalDestroy.apply(this, [newOptions]);
    });
  };
};

function _pickDefaults(data) {
  const defaults = this.defaults() || this.defaults;
  const ignoreRequestKeys = this.ignoreRequestKeys || [];
  const modelKeys = difference(Object.keys(defaults), ignoreRequestKeys);
  return pick(data, modelKeys);
}
