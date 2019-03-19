import {
  FETCH_PATIENT_REQUEST,
  FETCH_PATIENT_SUCCESS,
  FETCH_PATIENT_FAILED,
  SAVE_PATIENT_REQUEST,
  SAVE_PATIENT_SUCCESS,
  SAVE_PATIENT_FAILED,
  SAVE_PATIENT_RESET,
} from '../../actions/types';

export default {
  [FETCH_PATIENT_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [FETCH_PATIENT_SUCCESS]: ({ patient, action }, state) => ({
    ...state,
    patient,
    action,
    loading: false,
  }),
  [FETCH_PATIENT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [SAVE_PATIENT_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [SAVE_PATIENT_SUCCESS]: ({ patient }, state) => ({
    ...state,
    patient,
    action: 'edit',
    loading: false,
    saved: true,
  }),
  [SAVE_PATIENT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [SAVE_PATIENT_RESET]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
    saved: false,
  }),
};
