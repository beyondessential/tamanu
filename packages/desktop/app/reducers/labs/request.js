import {
  FETCH_LAB_REQUEST_REQUEST,
  FETCH_LAB_REQUEST_SUCCESS,
  FETCH_LAB_REQUEST_FAILED,
  SAVE_LAB_REQUEST_REQUEST,
  SAVE_LAB_REQUEST_SUCCESS,
  SAVE_LAB_REQUEST_FAILED,
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
};
