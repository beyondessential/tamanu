import Backbone from 'backbone-associations';
import { getClient, history, notify } from '.';
import { AUTH_LOGOUT } from '../actions/types';

export default (store) => {
  const originalSyncFunc = Backbone.sync;
  Backbone.Model.prototype.idAttribute = '_id';
  Backbone.sync = (method, model, options={}) => {
    const newOptions = _getOptions(options);
    const { error: originalError } = newOptions;
    newOptions.error = (xhr, textStatus, error) => {
      _errorHandler({ xhr, textStatus, error });
      return originalError(xhr, textStatus, error);
    }
    return originalSyncFunc.call(model, method, model, newOptions);
  };

  const _getOptions = (options) => {
    let { headers } = options;
    headers = { ...headers, ..._getHeaders() };
    return { ...options, headers };
  }

  const _getHeaders = () => ({ 'Authorization': `Basic ${_encodeCredentials()}` });

  const _encodeCredentials = () => {
    const clientId = getClient();
    const { auth } = store.getState();
    const { secret } = auth;

    return btoa(unescape(encodeURIComponent(
      [clientId, secret].join(':'))));
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
      notify('Operation not permitted!');
    }
  };

  // Add promise support to backbone model
  const originalSave = Backbone.Model.prototype.save;
  Backbone.Model.prototype.save = function saveData(data, options) {
    return new Promise(async (resolve, reject) => {
      const newOptions = {
        ...options,
        wait: true,
        success: resolve,
        error: reject
      };

      // Get current rev
      originalSave.apply(this, [data, newOptions]);
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
        error: reject
      };

      originalDestroy.apply(this, [newOptions]);
    });
  };
};
