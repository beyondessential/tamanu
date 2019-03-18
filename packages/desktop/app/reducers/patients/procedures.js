import {
  FETCH_PROCEDURE_REQUEST,
  FETCH_PROCEDURE_SUCCESS,
  FETCH_PROCEDURE_FAILED,
  SAVE_PROCEDURE_REQUEST,
  SAVE_PROCEDURE_SUCCESS,
  SAVE_PROCEDURE_FAILED,
} from '../../actions/types';

export default {
  [FETCH_PROCEDURE_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [FETCH_PROCEDURE_SUCCESS]: ({ procedure, action }, state) => ({
    ...state,
    procedure,
    action,
    loading: false,
  }),
  [FETCH_PROCEDURE_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [SAVE_PROCEDURE_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [SAVE_PROCEDURE_SUCCESS]: ({ patient, procedure }, state) => ({
    ...state,
    patient,
    procedure,
    action: 'edit',
    loading: false,
  }),
  [SAVE_PROCEDURE_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
};
