import { createReducer } from '../utils/createReducer';
import { createDummyPatient } from '../../stories/dummyPatient';

// actions
const PATIENT_LOAD_START = 'PATIENT_LOAD_START';
const PATIENT_LOAD_FINISH = 'PATIENT_LOAD_FINISH';

export const viewPatient = id => async (dispatch, getState, { api }) => {
  dispatch({ type: PATIENT_LOAD_START, id });

  const patient = await api.get(`patient/${id}`);

  dispatch({ type: PATIENT_LOAD_FINISH, patient });
};

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [PATIENT_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [PATIENT_LOAD_FINISH]: action => ({
    loading: false,
    ...action.patient,
  }),
};

export const patientReducer = createReducer(defaultState, handlers);
