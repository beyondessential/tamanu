import { push } from 'connected-react-router';

import { reloadVisit } from './visit';
import { reloadPatient } from './patient';

import { createReducer } from '../utils/createReducer';

// actions
const IMAGING_LOAD_START = 'IMAGING_LOAD_START';
const IMAGING_LOAD_FINISH = 'IMAGING_LOAD_FINISH';

export const viewImagingRequest = id => async dispatch => {
  dispatch(reloadImagingRequest(id));
  dispatch(push('/patients/visit/imagingRequest'));
};

export const reloadImagingRequest = id => async (dispatch, getState, { api }) => {
  dispatch({ type: IMAGING_LOAD_START, id });

  const imagingRequest = await api.get(`imagingRequest/${id}`);
  // TODO handle error state

  const visit = imagingRequest.visits[0];
  if (visit) {
    dispatch(reloadVisit(visit._id));

    const patient = visit.patient[0];
    if (patient) {
      dispatch(reloadPatient(patient._id));
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

export const imagingRequestReducer = createReducer(defaultState, handlers);
