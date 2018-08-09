import { to } from 'await-to-js';
import moment from 'moment';
import { visitStatuses } from '../../constants';
import {
  FETCH_MEDICATION_REQUEST,
  FETCH_MEDICATION_SUCCESS,
  FETCH_MEDICATION_FAILED,
  SAVE_MEDICATION_REQUEST,
  SAVE_MEDICATION_SUCCESS,
  SAVE_MEDICATION_FAILED,
} from '../types';
import { PatientModel, MedicationModel } from '../../models';

export const fetchMedication = ({ patientId, id }) =>
  async dispatch => {
    dispatch({ type: FETCH_MEDICATION_REQUEST });
    let error = null;
    const action = id ? 'edit' : 'new';
    const patientModel = new PatientModel();
    if (patientId) {
      patientModel.set({ _id: patientId });
      [error] = await to(patientModel.fetch({ relations: true, deep: false }));
    }
    const medicationModel = new MedicationModel();
    if (action === 'edit' && id && !error) {
      medicationModel.set({ _id: id });
      [error] = await to(medicationModel.fetch({ relations: true, deep: false }));
    }
    // if (error) return dispatch({ type: FETCH_MEDICATION_FAILED, error });
    dispatch({
      type: FETCH_MEDICATION_SUCCESS,
      patient: patientModel,
      medication: medicationModel,
      loading: false,
    });
  };

export const saveMedication = ({ action, visitModel, patientModel, history, setStatus }) =>
  async dispatch => {
    dispatch({ type: SAVE_MEDICATION_REQUEST });
    if (visitModel.isValid()) {
      try {
        const endDate = visitModel.get('endDate');
        if (endDate instanceof moment && !endDate.isValid()) visitModel.set('endDate', null, { silent: true });
        if (setStatus) _setStatus({ visitModel, patientModel });
        const Model = await visitModel.save(null, { silent: true });
        if (action === 'new') patientModel.get('visits').add({ _id: Model.id });
        if (patientModel.changed) await patientModel.save(null, { silent: true });
        dispatch({
          type: SAVE_MEDICATION_SUCCESS,
          patient: patientModel,
          visit: Model,
        });
        if (action === 'new') history.push(`/patients/visit/${patientModel.id}/${Model.id}`);
      } catch (error) {
        console.log({ error });
        dispatch({ type: SAVE_MEDICATION_FAILED, error });
      }
    } else {
      const error = visitModel.validationError;
      console.log({ error });
      dispatch({ type: SAVE_MEDICATION_FAILED, error });
    }
  };

const _setStatus = ({ visitModel, patientModel }) => {
  if (moment(visitModel.get('startDate')).isSameOrBefore(moment()) &&
    (
      visitModel.get('endDate') === null ||
      moment(visitModel.get('endDate')).isSameOrAfter(moment())
    )
  ) {
    if (visitModel.get('visitType') === 'admission') {
      visitModel.set('status', visitStatuses.ADMITTED);
      patientModel.set('admitted', true);
    }
    if (visitModel.get('visitType') !== 'admission') visitModel.set('status', visitStatuses.CHECKED_IN);
  }
};
