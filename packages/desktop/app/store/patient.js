import { createReducer } from '../utils/createReducer';

// actions
const PATIENT_LOAD_START = 'PATIENT_LOAD_START';
const PATIENT_LOAD_ERROR = 'PATIENT_LOAD_ERROR';
const PATIENT_LOAD_FINISH = 'PATIENT_LOAD_FINISH';

export const viewPatient = id => async (dispatch, getState, { api }) => {
  dispatch({ type: PATIENT_LOAD_START, id });

  try {
    const patient = await api.get(`patient/${id}`);
    dispatch({ type: PATIENT_LOAD_FINISH, patient });
  } catch(e) {
    dispatch({ type: PATIENT_LOAD_ERROR, error: e.message });
  }
};

// reducers

const defaultState = {
  loading: true,
  id: null,
  error: "",
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
