import {
  FETCH_OPERATION_REPORT_REQUEST,
  FETCH_OPERATION_REPORT_SUCCESS,
  FETCH_OPERATION_REPORT_FAILED,
  SAVE_OPERATION_REPORT_REQUEST,
  SAVE_OPERATION_REPORT_SUCCESS,
  SAVE_OPERATION_REPORT_FAILED,
} from '../types';
import { OperationReportModel, PatientModel } from '../../models';
import { notifySuccess } from '../../utils';

export const fetchOperationReport = ({ id, patientId }) => async dispatch => {
  dispatch({ type: FETCH_OPERATION_REPORT_REQUEST });
  let error;
  const action = id ? 'edit' : 'new';
  const operationReportModel = new OperationReportModel();
  const patientModel = new PatientModel({ _id: patientId });
  try {
    const modelsToFetch = [patientModel.fetch()];
    if (action === 'edit') {
      operationReportModel.set({ _id: id });
      modelsToFetch.push(operationReportModel.fetch());
    }

    await Promise.all(modelsToFetch);
    return dispatch({
      type: FETCH_OPERATION_REPORT_SUCCESS,
      operationReportModel,
      patientModel,
      action,
      loading: false,
    });
  } catch (e) {
    return dispatch({ type: FETCH_OPERATION_REPORT_FAILED, error });
  }
};

export const saveOperationReport = ({ operationReportModel }) => async dispatch => {
  dispatch({ type: SAVE_OPERATION_REPORT_REQUEST });
  if (operationReportModel.isValid()) {
    try {
      await operationReportModel.save();
      notifySuccess('Operation Report saved successfully.');
      dispatch({ type: SAVE_OPERATION_REPORT_SUCCESS, operationReportModel });
    } catch (error) {
      console.error({ error });
      dispatch({ type: SAVE_OPERATION_REPORT_FAILED, error });
    }
  } else {
    const error = operationReportModel.validationError;
    console.error({ error });
    dispatch({ type: SAVE_OPERATION_REPORT_FAILED, error });
  }
};
