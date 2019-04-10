import {
  FETCH_OPERATIVE_PLAN_REQUEST,
  FETCH_OPERATIVE_PLAN_SUCCESS,
  FETCH_OPERATIVE_PLAN_FAILED,
  SAVE_OPERATIVE_PLAN_REQUEST,
  SAVE_OPERATIVE_PLAN_SUCCESS,
  SAVE_OPERATIVE_PLAN_FAILED,
} from '../../actions/types';

export default {
  [FETCH_OPERATIVE_PLAN_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [FETCH_OPERATIVE_PLAN_SUCCESS]: ({ operativePlanModel, patientModel, action }, state) => ({
    ...state,
    operativePlanModel,
    patient: patientModel,
    action,
    loading: false,
  }),
  [FETCH_OPERATIVE_PLAN_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [SAVE_OPERATIVE_PLAN_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [SAVE_OPERATIVE_PLAN_SUCCESS]: ({ operativePlanModel }, state) => ({
    ...state,
    operativePlanModel,
    action: 'edit',
    loading: false,
  }),
  [SAVE_OPERATIVE_PLAN_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
};
