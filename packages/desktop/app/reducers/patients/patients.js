import {
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
  FETCH_PATIENTS_REQUEST,
  FETCH_PATIENTS_SUCCESS,
  FETCH_PATIENTS_FAILED,
} from '../../actions/types';

export default {
  [CREATE_PATIENT_REQUEST]: (_, state) => ({
    ...state,
    patientInProgress: true,
    createPatientSuccess: false,
    deletePatientSuccess: false,
  }),
  [CREATE_PATIENT_SUCCESS]: (_, state) => ({
    ...state,
    patientInProgress: false,
    createPatientSuccess: true,
    deletePatientSuccess: false,
  }),
  [CREATE_PATIENT_FAILED]: (_, state) => ({
    ...state,
    patientInProgress: false,
    formError: true,
    createPatientSuccess: false,
    deletePatientSuccess: false,
  }),
  [FETCH_PATIENTS_REQUEST]: (_, state) => ({
    ...state,
    deletePatientSuccess: false,
  }),

  [FETCH_PATIENTS_SUCCESS]: ({ patients }, state) => ({
    ...state,
    patients,
    deletePatientSuccess: false,
  }),
  [FETCH_PATIENTS_FAILED]: (_, state) => ({
    ...state,
    deletePatientSuccess: false,
  }),
  [FETCH_PATIENTS_REQUEST]: (_, state) => ({
    ...state,
    deletePatientSuccess: false,
  }),
};

// default (state = initialState, action) => {
//  switch (action.type) {
//    case :
//      return {
//      };
//    case :
//      return {
//      };
//    case FETCH_ADMITTED_PATIENTS_REQUEST:
//      return {
//        ...state,
//      };
//    case FETCH_ADMITTED_PATIENTS_SUCCESS:
//      return {
//        ...state,
//        admittedPatients: action.payload
//      };
//    case FETCH_ADMITTED_PATIENTS_FAILED:
//      return {
//        ...state,
//        admittedPatients: []
//      };
//    case FETCH_ONE_PATIENT_REQUEST:
//      return {
//        ...state,
//      };
//    case FETCH_ONE_PATIENT_SUCCESS:
//      return {
//        ...state,
//        onePatient: action.payload
//      };
//    case FETCH_ONE_PATIENT_FAILED:
//      return {
//        ...state,
//      };
//    case DELETE_PATIENT_REQUEST:
//      return {
//        ...state,
//        createPatientSuccess: false,
//        deletePatientSuccess: false
//      };
//    case DELETE_PATIENT_SUCCESS:
//      return {
//        ...state,
//        createPatientSuccess: false,
//        deletePatientSuccess: true
//      };
//    case DELETE_PATIENT_FAILED:
//      return {
//        ...state,
//        createPatientSuccess: false,
//        deletePatientSuccess: false
//      };
//    case GET_UPDATED_BIRTHDAY_REQUEST:
//      return {
//        ...state,
//      };
//    case GET_UPDATED_BIRTHDAY_SUCCESS:
//      return {
//        ...state,
//        updatedBirthday: action.payload
//      };
//    case GET_UPDATED_BIRTHDAY_FAILED:
//      return {
//        ...state,
//      };
//    case GET_UPDATED_REFERDATE_REQUEST:
//      return {
//        ...state,
//      };
//    case GET_UPDATED_REFERDATE_SUCCESS:
//      return {
//        ...state,
//        updatedReferredDate: action.payload
//      };
//    case GET_UPDATED_REFERDATE_FAILED:
//      return {
//        ...state,
//      };
//    default:
//      return state;
//  }
// };
