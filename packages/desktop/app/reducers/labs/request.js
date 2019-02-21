import {
  FETCH_LAB_REQUEST,
  FETCH_LAB_SUCCESS,
  FETCH_LAB_FAILED,
  SAVE_LAB_REQUEST,
  SAVE_LAB_SUCCESS,
  SAVE_LAB_FAILED,
} from '../../actions/types';

export default {
  [FETCH_LAB_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_LAB_SUCCESS]: ({ patient, tests }, state) => ({
    ...state,
    patient,
    tests,
    loading: false
  }),
  [FETCH_LAB_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [SAVE_LAB_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [SAVE_LAB_SUCCESS]: (_, state) => ({
    ...state,
    loading: false
  }),
  [SAVE_LAB_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
};
