import {
  FETCH_APPOINTMENT_REQUEST,
  FETCH_APPOINTMENT_SUCCESS,
  FETCH_APPOINTMENT_FAILED,
  SAVE_APPOINTMENT_REQUEST,
  SAVE_APPOINTMENT_SUCCESS,
  SAVE_APPOINTMENT_FAILED,
} from '../../actions/types';

export default {
  [FETCH_APPOINTMENT_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_APPOINTMENT_SUCCESS]: ({ appointment }, state) => ({
    ...state,
    appointment,
    loading: false
  }),
  [FETCH_APPOINTMENT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [SAVE_APPOINTMENT_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [SAVE_APPOINTMENT_SUCCESS]: (_, state) => ({
    ...state,
    loading: false
  }),
  [SAVE_APPOINTMENT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
};
