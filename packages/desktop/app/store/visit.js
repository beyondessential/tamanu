import { push } from 'connected-react-router';

import { createReducer } from '../utils/createReducer';

// actions
const VISIT_LOAD_START = 'VISIT_LOAD_START';
const VISIT_LOAD_FINISH = 'VISIT_LOAD_FINISH';

export const viewVisit = id => async dispatch => {
  dispatch(reloadVisit(id));
  dispatch(push('/patients/visit'));
};

export const reloadVisit = id => async (dispatch, getState, { api }) => {
  dispatch({ type: VISIT_LOAD_START, id });

  const visit = await api.get(`visit/${id}`);
  // TODO handle error state

  dispatch({ type: VISIT_LOAD_FINISH, visit });
};

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [VISIT_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [VISIT_LOAD_FINISH]: action => ({
    loading: false,
    ...action.visit,
  }),
};

export const visitReducer = createReducer(defaultState, handlers);
