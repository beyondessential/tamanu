import { push } from 'connected-react-router';
import { createReducer } from '../utils/createReducer';

import { reloadVisit } from './visit';

// actions
const PATIENT_LOAD_START = 'PATIENT_LOAD_START';
const PATIENT_LOAD_ERROR = 'PATIENT_LOAD_ERROR';
const PATIENT_LOAD_FINISH = 'PATIENT_LOAD_FINISH';

export const viewPatientVisit = (patientId, visitId, modal) => async dispatch => {
  dispatch(reloadPatient(patientId));
  dispatch(reloadVisit(visitId));
  dispatch(push(`/patients/visit/${modal}`));
};

export const viewPatient = (id, modal) => async dispatch => {
  dispatch(reloadPatient(id));
  dispatch(push(`/patients/view/${modal}`));
};

export const reloadPatient = id => async (dispatch, getState, { api }) => {
  dispatch({ type: PATIENT_LOAD_START, id });

  try {
    const patient = await api.get(`patient/${id}`);
    dispatch({ type: PATIENT_LOAD_FINISH, patient });
  } catch (e) {
    dispatch({ type: PATIENT_LOAD_ERROR, error: e.message });
  }
};

// selectors
export const getCurrentVisit = state => state.patient.visits.find(x => !x.endDate);
export const hasActiveTriage = patient =>
  patient.triages.find(x => !x.closedTime && !(x.visit && x.visit.endDate));

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
};

export const patientReducer = createReducer(defaultState, handlers);
