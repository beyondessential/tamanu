import {
  FETCH_MEDICATIONS_REQUEST,
  FETCH_MEDICATIONS_SUCCESS,
  FETCH_MEDICATIONS_FAILED,
} from '../../actions/types';

export default {
  [FETCH_MEDICATIONS_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [FETCH_MEDICATIONS_SUCCESS]: ({ medications, totalPages }, state) => ({
    ...state,
    medications,
    totalPages,
    loading: false,
  }),
  [FETCH_MEDICATIONS_FAILED]: ({ error }, state) => ({
    ...state,
    medications: [],
    error,
    loading: false,
  }),
};
