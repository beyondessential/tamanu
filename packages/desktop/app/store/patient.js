import { push } from 'connected-react-router';
import { createReducer } from '../utils/createReducer';

import { reloadVisit } from './visit';

// actions
const PATIENT_LOAD_START = 'PATIENT_LOAD_START';
const PATIENT_LOAD_ERROR = 'PATIENT_LOAD_ERROR';
const PATIENT_LOAD_FINISH = 'PATIENT_LOAD_FINISH';
const PATIENT_CLEAR = 'PATIENT_CLEAR';

export const viewPatientVisit = (patientId, visitId, modal) => async dispatch => {
  dispatch(reloadPatient(patientId));
  dispatch(reloadVisit(visitId));
  dispatch(push(`/patients/visit/${modal}`));
};

export const clearPatient = () => ({
  type: PATIENT_CLEAR,
});

export const viewPatient = (id, modal) => async dispatch => {
  dispatch(reloadPatient(id));
  dispatch(push(`/patients/view/${modal}`));
};

export const reloadPatient = id => async (dispatch, getState, { api }) => {
  dispatch({ type: PATIENT_LOAD_START, id });

  try {
    const [
      patient,
      currentVisit,
      familyHistory,
      allergies,
      issues,
      conditions,
    ] = await Promise.all([
      api.get(`patient/${id}`),
      api.get(`patient/${id}/currentVisit`),
      api.get(`patient/${id}/familyHistory`),
      api.get(`patient/${id}/allergies`),
      api.get(`patient/${id}/issues`),
      api.get(`patient/${id}/conditions`),
    ]);

    dispatch({
      type: PATIENT_LOAD_FINISH,
      patient: {
        currentVisit,
        issues: issues.data,
        conditions: conditions.data,
        allergies: allergies.data,
        familyHistory: familyHistory.data,
        ...patient,
      },
    });
  } catch (e) {
    dispatch({ type: PATIENT_LOAD_ERROR, error: e.message });
  }
};

// reducers

const defaultState = {
  loading: true,
  id: null,
  error: '',
};

const handlers = {
  [PATIENT_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [PATIENT_LOAD_ERROR]: action => ({
    loading: false,
    error: action.error,
  }),
  [PATIENT_LOAD_FINISH]: action => ({
    loading: false,
    ...action.patient,
  }),
  [PATIENT_CLEAR]: () => ({
    loading: false,
    id: null,
    error: '',
  }),
};

export const patientReducer = createReducer(defaultState, handlers);
