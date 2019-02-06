import { getClient, notify, history } from '../../utils';
import {
  AUTH_LOGIN_FAILED,
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGOUT
} from '../types';

export const login = ({ email, password }) =>
  async dispatch => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    try {
      const clientId = getClient();
      let res = await fetch(`${process.env.HOST}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, email, password })
      });
      res = await res.json();
      if (res.error) return _error({ error: res.error, dispatch });
      notify(false); // Dismiss all
      dispatch({
        type: AUTH_LOGIN_SUCCESS,
        ...res
      });
      return history.push('/');
    } catch (error) {
      _error({ error, dispatch });
    }
  }

  const _error = ({ error, dispatch }) => {
    notify(error);
    return dispatch({ type: AUTH_LOGIN_FAILED, error });
  }

  export const logout = () =>
    dispatch => {
      return  dispatch({ type: AUTH_LOGOUT });
    }
