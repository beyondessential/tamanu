import {
  FETCH_LAB_REQUEST_REQUEST,
  FETCH_LAB_REQUEST_SUCCESS,
  FETCH_LAB_REQUEST_FAILED,
  SAVE_LAB_REQUEST_REQUEST,
  SAVE_LAB_REQUEST_SUCCESS,
  SAVE_LAB_REQUEST_FAILED,
  FILTER_LAB_TEST_TYPES_REQUEST,
  FILTER_LAB_TEST_TYPES_SUCCESS,
  FILTER_LAB_TEST_TYPES_FAILED,
} from '../../actions/types';

export default {
  [FETCH_LAB_REQUEST_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true,
  }),
  [FETCH_LAB_REQUEST_SUCCESS]: ({ patient, labTestTypes }, state) => ({
    ...state,
    patient,
    labTestTypes,
    isLoading: false,
  }),
  [FETCH_LAB_REQUEST_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false,
  }),
  [SAVE_LAB_REQUEST_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true,
  }),
  [SAVE_LAB_REQUEST_SUCCESS]: (_, state) => ({
    ...state,
    isLoading: false,
  }),
  [SAVE_LAB_REQUEST_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false,
  }),
  [FILTER_LAB_TEST_TYPES_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true,
  }),
  [FILTER_LAB_TEST_TYPES_SUCCESS]: ({ labTestTypes }, state) => ({
    ...state,
    labTestTypes,
    isLoading: false,
  }),
  [FILTER_LAB_TEST_TYPES_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false,
  }),
};
