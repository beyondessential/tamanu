import {
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
  FETCH_PATIENTS_REQUEST,
  FETCH_PATIENTS_SUCCESS,
  FETCH_PATIENTS_FAILED
} from '../actions/types';

const initialState = {
  patients: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PATIENT_REQUEST:
      return {
        ...state,
      };
    case CREATE_PATIENT_SUCCESS:
      return {
        ...state,
      };
    case CREATE_PATIENT_FAILED:
      return {
        ...state,
      };
    case FETCH_PATIENTS_REQUEST:
      return {
        ...state,
      };
    case FETCH_PATIENTS_SUCCESS:
      return {
        ...state,
        patients: action.payload
      };
    case FETCH_PATIENTS_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
};
