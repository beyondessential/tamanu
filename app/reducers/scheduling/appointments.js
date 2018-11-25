import {
  FETCH_APPOINTMENTS_REQUEST,
  FETCH_APPOINTMENTS_SUCCESS,
  FETCH_APPOINTMENTS_FAILED,
} from '../../actions/types';

export default {
  [FETCH_APPOINTMENTS_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_APPOINTMENTS_SUCCESS]: ({ appointments }, state) => ({
    ...state,
    appointments,
    loading: false
  }),
  [FETCH_APPOINTMENTS_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
};
