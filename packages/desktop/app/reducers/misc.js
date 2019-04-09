import {
  SAVE_REDIRECT_LOCATION,
  CLEAR_REDIRECT_LOCATION,
} from '../actions/types';

const initialState = {
  redirectTo: '',
};

export default (state = initialState, { redirectTo, type }) => {
  switch (type) {
    case SAVE_REDIRECT_LOCATION:
      return {
        ...state,
        redirectTo,
      };
    case CLEAR_REDIRECT_LOCATION:
      return {
        ...state,
        redirectTo: null,
      };
    default:
      return state;
  }
};
