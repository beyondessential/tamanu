import {
  FETCH_VISIT_REQUEST,
  FETCH_VISIT_SUCCESS,
  FETCH_VISIT_FAILED,
  SAVE_VISIT_REQUEST,
  SAVE_VISIT_SUCCESS,
  SAVE_VISIT_FAILED,
  SAVE_VISIT_RESET,
} from '../../actions/types';

export default {
  [FETCH_VISIT_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_VISIT_SUCCESS]: ({ patient, visit, action }, state) => ({
    ...state,
    patient,
    visit,
    action,
    loading: false
  }),
  [FETCH_VISIT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [SAVE_VISIT_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [SAVE_VISIT_SUCCESS]: ({ patient, visit }, state) => ({
    ...state,
    patient,
    visit,
    action: 'edit',
    loading: false,
    saved: true
  }),
  [SAVE_VISIT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [SAVE_VISIT_RESET]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
    saved: false
  }),
};
