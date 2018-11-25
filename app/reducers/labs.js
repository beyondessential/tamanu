import {
  CREATE_LAB_REQUEST,
  CREATE_LAB_SUCCESS,
  CREATE_LAB_FAILED,
  FETCH_LABS_REQUEST,
  FETCH_LABS_SUCCESS,
  FETCH_LABS_FAILED,
} from '../actions/types';

const initialState = {
  labs: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_LAB_REQUEST:
      return {
        ...state,
      };
    case CREATE_LAB_SUCCESS:
      return {
        ...state,
      };
    case CREATE_LAB_FAILED:
      return {
        ...state,
      };
    case FETCH_LABS_REQUEST:
      return {
        ...state,
      };
    case FETCH_LABS_SUCCESS:
      return {
        ...state,
        labs: action.payload
      };
    case FETCH_LABS_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
};
