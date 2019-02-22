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
    isLoading: true
  }),
  [FETCH_LAB_SUCCESS]: ({ patient, tests }, state) => ({
    ...state,
    patient,
    tests,
    isLoading: false
  }),
  [FETCH_LAB_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false
  }),
  [SAVE_LAB_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true
  }),
  [SAVE_LAB_SUCCESS]: (_, state) => ({
    ...state,
    isLoading: false
  }),
  [SAVE_LAB_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false
  }),
};
