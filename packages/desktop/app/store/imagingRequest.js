import { push } from 'connected-react-router';

import { reloadPatient } from './patient';

import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
const IMAGING_LOAD_START = 'IMAGING_LOAD_START';
const IMAGING_LOAD_FINISH = 'IMAGING_LOAD_FINISH';

export const viewImagingRequest = id => async dispatch => {
  dispatch(reloadImagingRequest(id));
  dispatch(push('/patients/encounter/imagingRequest'));
};

export const reloadImagingRequest = id => async (dispatch, getState, { api }) => {
  dispatch({ type: IMAGING_LOAD_START, id });

  const imagingRequest = await api.get(`imagingRequest/${id}`);
  // TODO handle error state

  const encounter = imagingRequest.encounters?.[0];
  if (encounter) {
    const patient = encounter.patient[0];
    if (patient) {
      dispatch(reloadPatient(patient.id));
    }
  }

  dispatch({ type: IMAGING_LOAD_FINISH, imagingRequest });
};

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [IMAGING_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [IMAGING_LOAD_FINISH]: action => ({
    loading: false,
    ...action.imagingRequest,
  }),
};

export const imagingRequestReducer = createStatePreservingReducer(defaultState, handlers);
