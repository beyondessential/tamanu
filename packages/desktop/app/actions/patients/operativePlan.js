import {
  FETCH_OPERATIVE_PLAN_REQUEST,
  FETCH_OPERATIVE_PLAN_SUCCESS,
  FETCH_OPERATIVE_PLAN_FAILED,
  SAVE_OPERATIVE_PLAN_REQUEST,
  SAVE_OPERATIVE_PLAN_SUCCESS,
  SAVE_OPERATIVE_PLAN_FAILED,
} from '../types';
import {
  VisitModel, OperativePlanModel, PatientModel, OperationReportModel,
} from '../../models';
import { operativePlanStatuses } from '../../constants';
import { notifySuccess } from '../../utils';

export const fetchOperativePlan = ({ id, patientId }) => async dispatch => {
  dispatch({ type: FETCH_OPERATIVE_PLAN_REQUEST });
  let error;
  const action = id ? 'edit' : 'new';
  // const { patients: { patientModel, operativePlanModel } } = getState();
  const operativePlanModel = new OperativePlanModel();
  const patientModel = new PatientModel({ _id: patientId });
  try {
    const modelsToFetch = [patientModel.fetch()];
    if (action === 'edit') {
      operativePlanModel.set({ _id: id });
      modelsToFetch.push(operativePlanModel.fetch());
    }

    await Promise.all(modelsToFetch);
    return dispatch({
      type: FETCH_OPERATIVE_PLAN_SUCCESS,
      operativePlanModel,
      patientModel,
      action,
      loading: false,
    });
  } catch (e) {
    return dispatch({ type: FETCH_OPERATIVE_PLAN_FAILED, error });
  }
};

export const saveOperativePlan = ({
  action, operativePlanModel, patientId, history,
}) => async dispatch => {
  dispatch({ type: SAVE_OPERATIVE_PLAN_REQUEST });
  if (operativePlanModel.isValid()) {
    try {
      const visitId = operativePlanModel.get('visit');
      let visitModel = new VisitModel();
      await operativePlanModel.save();
      if (action === 'new') {
        visitModel.set({ _id: visitId });
        await visitModel.fetch();
        // link visit diagnoses to the operation plan
        const diagnoses = visitModel.get('diagnoses');
        operativePlanModel.set('diagnoses', diagnoses);
        await operativePlanModel.save();
        // link operative plan to the visit
        visitModel.get('operativePlans').add(operativePlanModel);
        await visitModel.save();
      } else if (action === 'edit') {
        visitModel = operativePlanModel.getVisit();
      }

      // create operative report if marked as completed
      if (operativePlanModel.get('status') === operativePlanStatuses.COMPLETED) {
        const operationReportModel = await createOperationReport({ operativePlanModel, visitModel });
        notifySuccess('Operation Report was generated successfully.');
        return history.push(`/patients/patient:${patientId}/operationReport:${operationReportModel.id}`);
      }

      dispatch({ type: SAVE_OPERATIVE_PLAN_SUCCESS, operativePlanModel });
      notifySuccess('Operative Plan saved successfully.');
      if (action === 'new') history.push(`/patients/patient:${patientId}/visit:${visitModel.id}/operativePlan:${operativePlanModel.id}`);
    } catch (error) {
      console.log({ error });
      dispatch({ type: SAVE_OPERATIVE_PLAN_FAILED, error });
    }
  } else {
    const error = operativePlanModel.validationError;
    console.log({ error });
    dispatch({ type: SAVE_OPERATIVE_PLAN_FAILED, error });
  }
};

const createOperationReport = async ({ operativePlanModel, visitModel }) => {
  const {
    additionalNotes, caseComplexity, actionsTaken,
    operationDescription, surgeon, diagnoses,
  } = operativePlanModel.toJSON();

  const operationReportModel = new OperationReportModel();
  operationReportModel.set({
    additionalNotes,
    caseComplexity,
    actionsTaken,
    operationDescription,
    surgeon,
    surgeryDate: new Date().toString(),
  });
  operationReportModel.get('preOpDiagnoses').set(diagnoses);
  await operationReportModel.save();
  visitModel.get('operationReports').add(operationReportModel);
  await visitModel.save();
  return operationReportModel;
};
