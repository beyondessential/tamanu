import moment from 'moment';
import { has } from 'lodash';
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
  FETCH_ONE_PATIENT_FAILED,
  DELETE_PATIENT_REQUEST,
  DELETE_PATIENT_SUCCESS,
  DELETE_PATIENT_FAILED,
  GET_UPDATED_BIRTHDAY_REQUEST,
  GET_UPDATED_BIRTHDAY_SUCCESS,
  GET_UPDATED_BIRTHDAY_FAILED,
  GET_UPDATED_REFERDATE_REQUEST,
  GET_UPDATED_REFERDATE_SUCCESS,
  GET_UPDATED_REFERDATE_FAILED,
} from '../actions/types';

const initialState = {
  patient: {},
  patientInProgress: false,
  createPatientSuccess: false,
  deletePatientSuccess: false,
  updatedBirthday: moment(),
  updatedReferredDate: moment(),
  visit: {},
};

const stateChanges = {};

//  default (state = initialState, action) => {
//   switch (action.type) {
//     case CREATE_PATIENT_REQUEST:
//       return {
//         ...state,
//         patientInProgress: true,
//         createPatientSuccess: false,
//         deletePatientSuccess: false
//       };
//     case CREATE_PATIENT_SUCCESS:
//       return {
//         ...state,
//         patientInProgress: false,
//         createPatientSuccess: true,
//         deletePatientSuccess: false
//       };
//     case CREATE_PATIENT_FAILED:
//       return {
//         ...state,
//         patientInProgress: false,
//         formError: true,
//         createPatientSuccess: false,
//         deletePatientSuccess: false
//       };
//     case FETCH_PATIENTS_REQUEST:
//       return {
//         ...state,
//         deletePatientSuccess: false
//       };
//     case FETCH_PATIENTS_SUCCESS:
//       return {
//         ...state,
//         patients: action.payload,
//         deletePatientSuccess: false
//       };
//     case FETCH_PATIENTS_FAILED:
//       return {
//         ...state,
//         deletePatientSuccess: false
//       };
//     case FETCH_ADMITTED_PATIENTS_REQUEST:
//       return {
//         ...state,
//       };
//     case FETCH_ADMITTED_PATIENTS_SUCCESS:
//       return {
//         ...state,
//         admittedPatients: action.payload
//       };
//     case FETCH_ADMITTED_PATIENTS_FAILED:
//       return {
//         ...state,
//         admittedPatients: []
//       };
//     case FETCH_ONE_PATIENT_REQUEST:
//       return {
//         ...state,
//       };
//     case FETCH_ONE_PATIENT_SUCCESS:
//       return {
//         ...state,
//         onePatient: action.payload
//       };
//     case FETCH_ONE_PATIENT_FAILED:
//       return {
//         ...state,
//       };
//     case DELETE_PATIENT_REQUEST:
//       return {
//         ...state,
//         createPatientSuccess: false,
//         deletePatientSuccess: false
//       };
//     case DELETE_PATIENT_SUCCESS:
//       return {
//         ...state,
//         createPatientSuccess: false,
//         deletePatientSuccess: true
//       };
//     case DELETE_PATIENT_FAILED:
//       return {
//         ...state,
//         createPatientSuccess: false,
//         deletePatientSuccess: false
//       };
//     case GET_UPDATED_BIRTHDAY_REQUEST:
//       return {
//         ...state,
//       };
//     case GET_UPDATED_BIRTHDAY_SUCCESS:
//       return {
//         ...state,
//         updatedBirthday: action.payload
//       };
//     case GET_UPDATED_BIRTHDAY_FAILED:
//       return {
//         ...state,
//       };
//     case GET_UPDATED_REFERDATE_REQUEST:
//       return {
//         ...state,
//       };
//     case GET_UPDATED_REFERDATE_SUCCESS:
//       return {
//         ...state,
//         updatedReferredDate: action.payload
//       };
//     case GET_UPDATED_REFERDATE_FAILED:
//       return {
//         ...state,
//       };
//     default:
//       return state;
//   }
// };

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
