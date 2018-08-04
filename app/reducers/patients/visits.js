import {
  FETCH_VISIT_REQUEST,
  FETCH_VISIT_SUCCESS,
  FETCH_VISIT_FAILED,
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
};
