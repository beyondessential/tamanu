import { to } from 'await-to-js';
import moment from 'moment';
import {
  FETCH_MEDICATION_REQUEST,
  FETCH_MEDICATION_SUCCESS,
  FETCH_MEDICATION_FAILED,
  SAVE_MEDICATION_REQUEST,
  SAVE_MEDICATION_SUCCESS,
  SAVE_MEDICATION_FAILED,
} from '../types';
import { PatientModel, MedicationModel, VisitModel } from '../../models';

export const fetchMedication = ({ patientId, id }) => async dispatch => {
  dispatch({ type: FETCH_MEDICATION_REQUEST });
  let error = null;
  const action = id ? 'edit' : 'new';
  const patientModel = new PatientModel();
  if (patientId) {
    patientModel.set({ _id: patientId });
    [error] = await to(patientModel.fetch());
  }
  const medicationModel = new MedicationModel();
  if (action === 'edit' && id && !error) {
    medicationModel.set({ _id: id });
    [error] = await to(medicationModel.fetch());
  }
  if (error) return dispatch({ type: FETCH_MEDICATION_FAILED, error });
  return dispatch({
    type: FETCH_MEDICATION_SUCCESS,
    patient: patientModel,
    medicationModel,
    loading: false,
  });
};

export const saveMedication = ({
  action,
  medicationModel,
  patientId,
  history,
}) => async dispatch => {
  dispatch({ type: SAVE_MEDICATION_REQUEST });
  if (medicationModel.isValid()) {
    try {
      medicationModel.set('patient', { _id: patientId });
      const endDate = medicationModel.get('endDate');
      if (endDate instanceof moment && !endDate.isValid())
        medicationModel.set('endDate', null, { silent: true });
      await medicationModel.save(null, { silent: true });
      // Attach to visit
      if (action === 'new') {
        const visitModel = new VisitModel();
        visitModel.set('_id', medicationModel.get('visit'));
        await visitModel.fetch();
        visitModel.get('medication').add(medicationModel);
        await visitModel.save(null, { silent: true });
      }
      dispatch({ type: SAVE_MEDICATION_SUCCESS });
      if (action === 'new') history.push('/medication/requests');
    } catch (error) {
      console.error({ error });
      dispatch({ type: SAVE_MEDICATION_FAILED, error });
    }
  } else {
    const error = medicationModel.validationError;
    console.error({ error });
    dispatch({ type: SAVE_MEDICATION_FAILED, error });
  }
};
