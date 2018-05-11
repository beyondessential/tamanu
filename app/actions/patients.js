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
    dbHelpers.patientDB.post({
      firstName: patient.firstName || '',
      middleName: patient.middleName || '',
      lastName: patient.lastName || '',
      culturalName: patient.culturalName || '',
      sex: patient.sex || '',
      birthday: patient.birthday || '',
      age: patient.age || '',
      placeOfBirth: patient.placeOfBirth || '',
      occupation: patient.occupation || '',
      patientType: patient.patientType || '',
      patientStatus: patient.patientStatus || '',
      externalPatientId: patient.externalPatientId || '',
      bloodType: patient.bloodType || '',
      clinicSite: patient.clinicSite || '',
      referredBy: patient.referredBy || '',
      referredDate: patient.referredDate || '',
      religion: patient.religion || '',
      parent: patient.parent || '',
      paymentProfile: patient.paymentProfile || '',
      phone: patient.phone || '',
      address: patient.address || '',
      email: patient.email || '',
      country: patient.country || '',
    }).then(response => {
      console.log('response', response);
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
