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
import { PatientModel, MedicationHistoryModel } from '../../models';

export const fetchPatient = ({ id }) =>
  async dispatch => {
    dispatch({ type: FETCH_PATIENT_REQUEST });
    let error;
    const action = id ? 'edit' : 'new';
    const patientModel = new PatientModel();
    if (action === 'edit') {
      patientModel.set({ _id: id });
      [error] = await to(patientModel.fetch({ relations: true }));
      const { dateOfBirth, referredDate } = patientModel.attributes;
      if (dateOfBirth !== null) patientModel.set('dateOfBirth', moment(dateOfBirth));
      if (referredDate !== null) patientModel.set('referredDate', moment(referredDate));
    }
    if (error) return dispatch({ type: FETCH_PATIENT_FAILED, error });
    dispatch({
      type: FETCH_PATIENT_SUCCESS,
      patient: patientModel,
      action,
      loading: false,
    });
  };

export const savePatient = ({ Model }) =>
  async dispatch => {
    dispatch({ type: SAVE_PATIENT_REQUEST });
    if (Model.isValid()) {
      try {
        console.log('-Model-', Model, Model.toJSON());
        await Model.save(null, { silent: true });
        dispatch({
          type: SAVE_PATIENT_SUCCESS,
          patient: Model,
        });
      } catch (error) {
        console.log({ error });
        dispatch({ type: SAVE_PATIENT_FAILED, error });
      }
    } else {
      const error = Model.validationError;
      console.log({ error });
      dispatch({ type: SAVE_PATIENT_FAILED, error });
    }
  };
