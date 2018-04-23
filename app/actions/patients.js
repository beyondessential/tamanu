import {
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
} from './types';
import { idGenerator } from '../constants';

export function createPatientRequest() {
  return {
    type: CREATE_PATIENT_REQUEST
  };
}

export function createPatientSuccess(patients) {
  return {
    type: CREATE_PATIENT_SUCCESS,
    payload: patients
  };
}

export function createPatientFailed() {
  return {
    type: CREATE_PATIENT_FAILED
  };
}

export const createPatient = patient => {
  return dispatch => {
    dispatch(createPatientRequest());
    const existingPatients = JSON.parse(localStorage.getItem('patients')) || [];
    const patientInfo = patient;
    patientInfo.id = idGenerator();
    existingPatients.push(patientInfo);
    localStorage.setItem('patients', JSON.stringify(existingPatients));
  };
};
