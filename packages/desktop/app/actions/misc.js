import {
  SAVE_REDIRECT_LOCATION,
  CLEAR_REDIRECT_LOCATION,
} from './types';

export const setRedirectLocation = location => dispatch => {
  dispatch({ type: SAVE_REDIRECT_LOCATION, redirectTo: location });
};

export const clearRedirectLocation = () => dispatch => {
  dispatch({ type: CLEAR_REDIRECT_LOCATION, redirectTo: null });
};
