import { push } from 'connected-react-router';

import { createReducer } from '../utils/createReducer';

// actions
const LAB_LOAD_START = 'LAB_LOAD_START';
const LAB_LOAD_FINISH = 'LAB_LOAD_FINISH';

export const viewLab = id => async dispatch => {
  dispatch(reloadLab(id));
  dispatch(push('/patients/encounter/labRequest'));
};

export const reloadLab = id => async (dispatch, getState, { api }) => {
  dispatch({ type: LAB_LOAD_START, id });

  const labRequest = await api.get(`labRequest/${id}`);
  // TODO handle error state

  dispatch({ type: LAB_LOAD_FINISH, labRequest });
};

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [LAB_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [LAB_LOAD_FINISH]: action => ({
    loading: false,
    ...action.labRequest,
  }),
};

export const labRequestReducer = createReducer(defaultState, handlers);
