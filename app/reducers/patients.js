import {
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
  FETCH_PATIENTS_REQUEST,
  FETCH_PATIENTS_SUCCESS,
  FETCH_PATIENTS_FAILED,
  FETCH_ADMITTED_PATIENTS_REQUEST,
  FETCH_ADMITTED_PATIENTS_SUCCESS,
  FETCH_ADMITTED_PATIENTS_FAILED,
  FETCH_ONE_PATIENT_REQUEST,
  FETCH_ONE_PATIENT_SUCCESS,
  FETCH_ONE_PATIENT_FAILED
} from '../actions/types';

const initialState = {
  patients: [],
  onePatient: {},
  createPatientSuccess: false,
  admittedPatients: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PATIENT_REQUEST:
      return {
        ...state,
        createPatientSuccess: false
      };
    case CREATE_PATIENT_SUCCESS:
      return {
        ...state,
        createPatientSuccess: true
      };
    case CREATE_PATIENT_FAILED:
      return {
        ...state,
        createPatientSuccess: false
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
    case FETCH_ADMITTED_PATIENTS_REQUEST:
      return {
        ...state,
      };
    case FETCH_ADMITTED_PATIENTS_SUCCESS:
      return {
        ...state,
        admittedPatients: action.payload
      };
    case FETCH_ADMITTED_PATIENTS_FAILED:
      return {
        ...state,
        admittedPatients: []
      };
    case FETCH_ONE_PATIENT_REQUEST:
      return {
        ...state,
      };
    case FETCH_ONE_PATIENT_SUCCESS:
      return {
        ...state,
        onePatient: action.payload
      };
    case FETCH_ONE_PATIENT_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
};
