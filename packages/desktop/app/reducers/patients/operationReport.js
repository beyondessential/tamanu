import {
  FETCH_OPERATION_REPORT_REQUEST,
  FETCH_OPERATION_REPORT_SUCCESS,
  FETCH_OPERATION_REPORT_FAILED,
  SAVE_OPERATION_REPORT_REQUEST,
  SAVE_OPERATION_REPORT_SUCCESS,
  SAVE_OPERATION_REPORT_FAILED,
} from '../../actions/types';

export default {
  [FETCH_OPERATION_REPORT_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [FETCH_OPERATION_REPORT_SUCCESS]: ({ operationReportModel, patientModel, action }, state) => ({
    ...state,
    operationReportModel,
    patient: patientModel,
    action,
    loading: false,
  }),
  [FETCH_OPERATION_REPORT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [SAVE_OPERATION_REPORT_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [SAVE_OPERATION_REPORT_SUCCESS]: ({ operationReportModel }, state) => ({
    ...state,
    operationReportModel,
    action: 'edit',
    loading: false,
  }),
  [SAVE_OPERATION_REPORT_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
};
