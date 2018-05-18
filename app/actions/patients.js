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
  FETCH_ADMITTED_PATIENTS_FAILED,
  FETCH_ONE_PATIENT_REQUEST,
  FETCH_ONE_PATIENT_SUCCESS,
  FETCH_ONE_PATIENT_FAILED,
  DELETE_PATIENT_REQUEST,
  DELETE_PATIENT_SUCCESS,
  DELETE_PATIENT_FAILED
} from './types';
import { patientDB } from '../utils/dbHelper';
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

export function fetchOnePatientRequest() {
  return {
    type: FETCH_ONE_PATIENT_REQUEST
  };
}

export function fetchOnePatientSuccess(patient) {
  return {
    type: FETCH_ONE_PATIENT_SUCCESS,
    payload: patient
  };
}

export function fetchOnePatientFailed() {
  return {
    type: FETCH_ONE_PATIENT_FAILED
  };
}

export function deletePatientRequest() {
  return {
    type: DELETE_PATIENT_REQUEST
  };
}

export function deletePatientSuccess(patient) {
  return {
    type: DELETE_PATIENT_SUCCESS,
    payload: patient
  };
}

export function deletePatientFailed() {
  return {
    type: DELETE_PATIENT_FAILED
  };
}


export const createPatientIndexes = () => {
  return dispatch => {
    dispatch(createPatientIndexesRequest());
    patientDB.createIndex({
      index: {
        fields: ['_id', 'admitted']
      }
    }).then((result) => {
      dispatch(createPatientIndexesSuccess(result));
    }).catch((err) => {
      dispatch(createPatientIndexesFailed(err));
    });
  };
};

export const createPatient = patient => {
  return dispatch => {
    dispatch(createPatientRequest());
    getDisplayId('P').then(displayId => {
      patientDB.insert({
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
        return null;
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
    patientDB.list({
      include_docs: true,
      attachments: true
    }).then((result) => {
      const patients = [];
      result.rows.map(row => {
        if (row.doc.firstName) {
          patients.push(row.doc);
        }
      });
      dispatch(fetchPatientsSuccess(patients));
    }).catch((err) => {
      console.log(err);
    });
  };
};

export const fetchAdmittedPatients = () => {
  return dispatch => {
    dispatch(fetchAdmittedPatientsRequest());
    patientDB.find({
      selector: { admitted: { $eq: true } }
    }).then((filteredResult) => {
      dispatch(fetchAdmittedPatientsSuccess(filteredResult.docs));
    }).catch((err) => {
      dispatch(fetchAdmittedPatientsFailed(err));
    });
  };
};

export const fetchOnePatient = (id) => {
  return dispatch => {
    dispatch(fetchOnePatientRequest());
    patientDB.find({
      selector: { _id: { $eq: id } }
    }).then((filteredResult) => {
      dispatch(fetchOnePatientSuccess(filteredResult.docs[0]));
    }).catch((err) => {
      dispatch(fetchAdmittedPatientsFailed(err));
    });
  };
};

export const deletePatient = (patient) => {
  return dispatch => {
    dispatch(deletePatientRequest());
    // patientDB.destroy({
    //   docName: patient._id,
    //   rev: patient._rev
    // }).then((result) => {
    //   console.log('result', result);
    //   // dispatch(deletePatientSuccess(filteredResult.docs[0]));
    // }).catch((err) => {
    //   console.log(err);
    //   dispatch(deletePatientFailed(err));
    // });
    patientDB.destroy(patient._id, patient._rev, (result) => {
      dispatch(deletePatientSuccess(result));
    });
  };
};
