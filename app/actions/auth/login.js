import { toast } from 'react-toastify';
import {
  AUTH_LOGIN_FAILED,
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGOUT
} from '../types';

export const login = ({ email, password }) =>
  dispatch => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    if (email === 'demo@beyondessential.com.au' && password === 'demo@123') {
      return  dispatch({
        type: AUTH_LOGIN_SUCCESS,
        email: 'demo@beyondessential.com.au',
        userId: 'demo-user',
        displayName: 'Demo User',
        secret: 'kkkllloo000i88i'
       });
    }
    toast('Invalid email or password entered');
    return dispatch({ type: AUTH_LOGIN_FAILED, error: 'Invalid email or password entered' });
  }

  export const logout = () =>
    dispatch => {
      return  dispatch({ type: AUTH_LOGOUT });
    }
