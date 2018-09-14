import { to } from 'await-to-js';
import moment from 'moment';
import {
  FETCH_PATIENT_REQUEST,
  FETCH_PATIENT_SUCCESS,
  FETCH_PATIENT_FAILED,
  SAVE_PATIENT_REQUEST,
  SAVE_PATIENT_SUCCESS,
  SAVE_PATIENT_FAILED,
} from '../types';
import { VisitModel, PatientModel } from '../../models';

export const fetchPatient = ({ id }) =>
  async dispatch => {
    dispatch({ type: FETCH_PATIENT_REQUEST });
    let error;
    const action = id ? 'edit' : 'new';
    const patientModel = new PatientModel();
    if (action === 'edit') {
      patientModel.set({ _id: id });
      [error] = await to(patientModel.fetch({ relations: true }));
      // const patientDate = patientModel.get('patientDate');
      // if (typeof patientDate === 'string') patientModel.set('patientDate', moment(patientDate));
    }
    if (error) return dispatch({ type: FETCH_PATIENT_FAILED, error });
    dispatch({
      type: FETCH_PATIENT_SUCCESS,
      patient: patientModel,
      action,
      loading: false,
    });
  };

export const savePatient = ({ action, patientModel, visitId, history }) =>
  async dispatch => {
    dispatch({ type: SAVE_PATIENT_REQUEST });
    if (patientModel.isValid()) {
      try {
        await patientModel.save(null, { silent: true });
        if (action === 'new') {
          const visitModel = new VisitModel();
          visitModel.set({ _id: visitId });
          await visitModel.fetch();
          visitModel.get('patients').add({ _id: patientModel.id });
          await visitModel.save(null, { silent: true });
        }
        dispatch({
          type: SAVE_PATIENT_SUCCESS,
          patient: patientModel,
        });
        if (action === 'new')
          history.push(`/patients/visit/${visitId}/patient/${patientModel.id}`);
      } catch (error) {
        console.log({ error });
        dispatch({ type: SAVE_PATIENT_FAILED, error });
      }
    } else {
      const error = patientModel.validationError;
      console.log({ error });
      dispatch({ type: SAVE_PATIENT_FAILED, error });
    }
  };
