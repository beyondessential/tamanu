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
  [FETCH_PROCEDURE_SUCCESS]: ({ procedureModel, action }, state) => ({
    ...state,
    procedureModel,
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
  [SAVE_PROCEDURE_SUCCESS]: ({ patientModel, procedureModel }, state) => ({
    ...state,
    patient: patientModel,
    procedureModel,
    action: 'edit',
    loading: false,
  }),
  [SAVE_PROCEDURE_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
};
