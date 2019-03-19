import { to } from 'await-to-js';
import moment from 'moment';
import { toast } from 'react-toastify';
import { isEmpty } from 'lodash';
import { history } from '../../utils';
import { DISPLAY_ID_PLACEHOLDER, DB_OBJECTS_MAX_DEPTH } from '../../constants';
import {
  FETCH_PATIENT_REQUEST,
  FETCH_PATIENT_SUCCESS,
  FETCH_PATIENT_FAILED,
  SAVE_PATIENT_REQUEST,
  SAVE_PATIENT_SUCCESS,
  SAVE_PATIENT_FAILED,
} from '../types';
import { PatientModel } from '../../models';

export const fetchPatient = ({ id }) => async dispatch => {
  dispatch({ type: FETCH_PATIENT_REQUEST });
  let error;
  const action = id ? 'edit' : 'new';
  const patientModel = new PatientModel();
  if (action === 'edit') {
    patientModel.set({ _id: id });
    [error] = await to(patientModel.fetch({ data: { objects_max_depth: DB_OBJECTS_MAX_DEPTH.PATIENT_MAIN } }));
    const { dateOfBirth, referredDate } = patientModel.attributes;
    if (dateOfBirth !== null) patientModel.set('dateOfBirth', moment(dateOfBirth));
    if (referredDate !== null) patientModel.set('referredDate', moment(referredDate));
  }
  if (error) return dispatch({ type: FETCH_PATIENT_FAILED, error });
  return dispatch({
    type: FETCH_PATIENT_SUCCESS,
    patient: patientModel,
    action,
    loading: false,
  });
};

export const savePatient = ({ Model }) => async dispatch => {
  dispatch({ type: SAVE_PATIENT_REQUEST });
  if (Model.isValid()) {
    try {
      const attrs = {};
      const isNew = Model.isNew();
      if (isEmpty(Model.get('displayId'))) {
        attrs.displayId = DISPLAY_ID_PLACEHOLDER;
      }
      await Model.save(attrs, { silent: true });
      toast('Patient saved successfully.', { type: toast.TYPE.SUCCESS });
      dispatch({
        type: SAVE_PATIENT_SUCCESS,
        patient: Model,
      });
      if (isNew) history.push(`/patients/editPatient/${Model.id}`);
    } catch (error) {
      console.error({ error });
      dispatch({ type: SAVE_PATIENT_FAILED, error });
    }
  } else {
    const error = Model.validationError;
    console.error({ error });
    dispatch({ type: SAVE_PATIENT_FAILED, error });
  }
};
