import Backbone from 'backbone-associations';
import { getClient, history } from '.';
import { AUTH_LOGOUT } from '../actions/types';

export default (store) => {
  const originalSyncFunc = Backbone.sync;
  Backbone.Model.prototype.idAttribute = '_id';
  Backbone.sync = (method, model, options={}) => {
    const newOptions = _getOptions(options);
    const { error: originalError } = newOptions;
    newOptions.error = (xhr, textStatus, error) =>
      _errorHandler({ xhr, textStatus, error, next: () => originalError(xhr, textStatus, error)});
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

  const _errorHandler = ({ xhr, next }) => {
    const { status } = xhr;
    // 401 - Unauthorized
    if (status === 401) {
      store.dispatch({ type: AUTH_LOGOUT });
      return history.push('/login');
    }
    next();
  };
};
