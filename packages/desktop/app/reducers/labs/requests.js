import {
  FETCH_LABS_REQUEST,
  FETCH_LABS_SUCCESS,
  FETCH_LABS_FAILED,
} from '../../actions/types';

export default {
  [FETCH_LABS_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_LABS_SUCCESS]: ({ labs, totalPages }, state) => ({
    ...state,
    labs,
    totalPages,
    loading: false
  }),
  [FETCH_LABS_FAILED]: ({ error }, state) => ({
    ...state,
    labs: [],
    error,
    loading: false
  }),
};
