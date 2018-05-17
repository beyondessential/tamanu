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
  DELETE_PATIENT_FAILED,
  CHECKIN_PATIENT_REQUEST,
  CHECKIN_PATIENT_SUCCESS,
  CHECKIN_PATIENT_FAILED
} from './types';
import { patientDB } from '../utils/dbHelper';

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

export function checkInPatientRequest() {
  return {
    type: CHECKIN_PATIENT_REQUEST
  };
}

export function checkInPatientSuccess(patient) {
  return {
    type: CHECKIN_PATIENT_SUCCESS,
    payload: patient
  };
}

export function checkInPatientFailed() {
  return {
    type: CHECKIN_PATIENT_FAILED
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

export const createPatient = (patient, history) => {
  return dispatch => {
    dispatch(createPatientRequest());
    patient.save(patient.attributes, {
      success: (model, response) => {
        dispatch(createPatientSuccess(response));
        history.push('/patients');
      },
      error: (model, response) => {
        console.log('error', response);
        return dispatch(createPatientFailed(response));
      }
    });
  };
};

export const fetchPatients = () => {
  return dispatch => {
    dispatch(fetchPatientsRequest());
    patientDB.allDocs({
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

export const checkInPatient = (patient) => {
  return dispatch => {
    dispatch(checkInPatientRequest());
    console.log(patientDB);
    // patientDB.destroy(patient._id, patient._rev, (result) => {
    //   dispatch(checkInPatientSuccess(result));
    // });
  };
};
