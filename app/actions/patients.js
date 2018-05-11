import {
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
  FETCH_PATIENTS_REQUEST,
  FETCH_PATIENTS_SUCCESS,
  FETCH_PATIENTS_FAILED
} from './types';
import { dbHelpers } from '../utils/dbHelper';

export function createPatientRequest() {
  return {
    type: CREATE_PATIENT_REQUEST
  };
}

export function createPatientSuccess(patient) {
  return {
    type: CREATE_PATIENT_SUCCESS,
    payload: patient
  };
}

export function createPatientFailed() {
  return {
    type: CREATE_PATIENT_FAILED
  };
}

export function fetchPatientsRequest() {
  return {
    type: FETCH_PATIENTS_REQUEST
  };
}

export function fetchPatientsSuccess(patients) {
  return {
    type: FETCH_PATIENTS_SUCCESS,
    payload: patients
  };
}

export function fetchPatientsFailed() {
  return {
    type: FETCH_PATIENTS_FAILED
  };
}

export const createPatient = patient => {
  return dispatch => {
    dispatch(createPatientRequest());
    // const existingPatients = JSON.parse(localStorage.getItem('patients')) || [];
    // const patientInfo = patient;
    // patientInfo.id = idGenerator();
    // existingPatients.push(patientInfo);
    // localStorage.setItem('patients', JSON.stringify(existingPatients));
    dbHelpers.localDB.post({
      test: patient
    }).then(response => {
      // handle response
      console.log('response', response);
    }).catch((err) => {
      console.log(err);
    });
    // dbHelpers.localDB.allDocs({
    //   include_docs: true,
    //   attachments: true
    // }).then((result) => {
    //   // handle result
    //   console.log('result', result);
    // }).catch((err) => {
    //   console.log(err);
    // });
    dbHelpers.localDB.get('f0d27ab6-7e52-4dc0-8d2a-3de6ab5d168b').then((doc) => {
      // handle doc
      console.log('doc', doc);
    }).catch((err) => {
      console.log(err);
    });
  };
};

export const fetchPatients = () => {
  return dispatch => {
    dispatch(fetchPatientsRequest());
    const existingPatients = JSON.parse(localStorage.getItem('patients')) || [];
    dispatch(fetchPatientsSuccess(existingPatients));
  };
};
