import {
  CREATE_MEDICATION_REQUEST,
  CREATE_MEDICATION_SUCCESS,
  CREATE_MEDICATION_FAILED,
  CREATE_DISPENSE_REQUEST,
  CREATE_DISPENSE_SUCCESS,
  CREATE_DISPENSE_FAILED,
  FETCH_MEDICATIONS_REQUEST,
  FETCH_MEDICATIONS_SUCCESS,
  FETCH_MEDICATIONS_FAILED,
} from '../actions/types';

const initialState = {
  medications: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_MEDICATION_REQUEST:
      return {
        ...state,
      };
    case CREATE_MEDICATION_SUCCESS:
      return {
        ...state,
      };
    case CREATE_MEDICATION_FAILED:
      return {
        ...state,
      };
    case CREATE_DISPENSE_REQUEST:
      return {
        ...state,
      };
    case CREATE_DISPENSE_SUCCESS:
      return {
        ...state,
      };
    case CREATE_DISPENSE_FAILED:
      return {
        ...state,
      };
    case FETCH_MEDICATIONS_REQUEST:
      return {
        ...state,
      };
    case FETCH_MEDICATIONS_SUCCESS:
      return {
        ...state,
        medications: action.payload,
      };
    case FETCH_MEDICATIONS_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
};
