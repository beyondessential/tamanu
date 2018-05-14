import {
  CREATE_PATIENT_INDEXES_REQUEST,
  CREATE_PATIENT_INDEXES_SUCCESS,
  CREATE_PATIENT_INDEXES_FAILED,
  CREATE_PATIENT_REQUEST,
  CREATE_PATIENT_SUCCESS,
  CREATE_PATIENT_FAILED,
  FETCH_PATIENTS_REQUEST,
  FETCH_PATIENTS_SUCCESS,
  FETCH_PATIENTS_FAILED,
  FETCH_ADMITTED_PATIENTS_REQUEST,
  FETCH_ADMITTED_PATIENTS_SUCCESS,
  FETCH_ADMITTED_PATIENTS_FAILED
} from './types';
import { dbHelpers } from '../utils/dbHelper';
import { getDisplayId } from '../constants';

export function createPatientIndexesRequest() {
  return {
    type: CREATE_PATIENT_INDEXES_REQUEST
  };
}

export function createPatientIndexesSuccess(index) {
  return {
    type: CREATE_PATIENT_INDEXES_SUCCESS,
    payload: index
  };
}

export function createPatientIndexesFailed() {
  return {
    type: CREATE_PATIENT_INDEXES_FAILED
  };
}

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

export function fetchAdmittedPatientsRequest() {
  return {
    type: FETCH_ADMITTED_PATIENTS_REQUEST
  };
}

export function fetchAdmittedPatientsSuccess(patients) {
  return {
    type: FETCH_ADMITTED_PATIENTS_SUCCESS,
    payload: patients
  };
}

export function fetchAdmittedPatientsFailed() {
  return {
    type: FETCH_ADMITTED_PATIENTS_FAILED
  };
}

export const createPatientIndexes = () => {
  return dispatch => {
    dispatch(createPatientIndexesRequest());
    dbHelpers.patientDB.createIndex({
      index: {
        fields: ['admitted']
      }
    }).then((result) => {
      console.log('create index', result);
      dispatch(createPatientIndexesSuccess(result));
    }).catch((err) => {
      console.log('create index err', err);
      dispatch(createPatientIndexesFailed(err));
    });
  };
};

export const createPatient = patient => {
  return dispatch => {
    dispatch(createPatientRequest());
    getDisplayId('P').then(displayId => {
      dbHelpers.patientDB.post({
        displayId,
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
        admitted: false
      }).then(response => {
        dispatch(createPatientSuccess(response));
      }).catch((err) => {
        dispatch(createPatientFailed(err));
      });
    }).catch((err) => {
      console.log(err);
    });
  };
};

export const fetchPatients = () => {
  return dispatch => {
    dispatch(fetchPatientsRequest());
    dbHelpers.patientDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      dispatch(fetchPatientsSuccess(result.rows));
    }).catch((err) => {
      console.log(err);
    });
  };
};

export const fetchAdmittedPatients = () => {
  return dispatch => {
    dispatch(fetchAdmittedPatientsRequest());
    // dbHelpers.patientDB.createIndex({
    //   index: {
    //     fields: ['admitted']
    //   }
    // }).then((result) => {
    // console.log('create index', result);
    dbHelpers.patientDB.find({
      selector: { admitted: { $eq: true } }
    }).then((filteredResult) => {
      console.log(filteredResult);
      // dispatch(fetchAdmittedPatientsSuccess(result.rows));
    }).catch((err) => {
      console.log(err);
      dispatch(fetchAdmittedPatientsFailed(err));
    });
    // }).catch((err) => {
    //   console.log('create index err', err);
    // });
  };
};
