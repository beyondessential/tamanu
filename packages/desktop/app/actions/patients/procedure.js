import { to } from 'await-to-js';
import moment from 'moment';
import { notifySuccess } from '../../utils';
import {
  FETCH_PROCEDURE_REQUEST,
  FETCH_PROCEDURE_SUCCESS,
  FETCH_PROCEDURE_FAILED,
  SAVE_PROCEDURE_REQUEST,
  SAVE_PROCEDURE_SUCCESS,
  SAVE_PROCEDURE_FAILED,
} from '../types';
import { VisitModel, ProcedureModel } from '../../models';

export const fetchProcedure = ({ id }) => async dispatch => {
  dispatch({ type: FETCH_PROCEDURE_REQUEST });
  let error;
  const action = id ? 'edit' : 'new';
  const procedureModel = new ProcedureModel();
  procedureModel.set({ _id: id });
  if (action === 'edit') {
    procedureModel.set({ _id: id });
    [error] = await to(procedureModel.fetch());
    const procedureDate = procedureModel.get('procedureDate');
    if (typeof procedureDate === 'string')
      procedureModel.set('procedureDate', moment(procedureDate));
  }
  if (error) return dispatch({ type: FETCH_PROCEDURE_FAILED, error });
  dispatch({
    type: FETCH_PROCEDURE_SUCCESS,
    procedureModel,
    action,
    loading: false,
  });
};

export const saveProcedure = ({
  action,
  procedureModel,
  visitId,
  history,
  setSubmitting,
}) => async dispatch => {
  dispatch({ type: SAVE_PROCEDURE_REQUEST });
  try {
    await procedureModel.save(null, { silent: true });
    if (action === 'new') {
      const visitModel = new VisitModel();
      visitModel.set({ _id: visitId });
      await visitModel.fetch();
      visitModel.get('procedures').add(procedureModel);
      await visitModel.save(null, { silent: true });
    }
    dispatch({
      type: SAVE_PROCEDURE_SUCCESS,
      procedureModel,
    });
    notifySuccess('Procedure was saved successfully.');
    if (action === 'new') history.push(`/patients/visit/${visitId}/procedure/${procedureModel.id}`);
  } catch (error) {
    console.error({ error });
    dispatch({ type: SAVE_PROCEDURE_FAILED, error });
  }
  // reset `isSubmitting` status
  setSubmitting(false);
};
