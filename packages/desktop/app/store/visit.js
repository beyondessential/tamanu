import { push } from 'connected-react-router';

import { createReducer } from '../utils/createReducer';
import { createDummyVisit } from '../../stories/dummyPatient';

// actions
const VISIT_LOAD_START = 'VISIT_LOAD_START';
const VISIT_LOAD_FINISH = 'VISIT_LOAD_FINISH';

export const viewVisit = id => async dispatch => {
  dispatch({ type: VISIT_LOAD_START, id });
  dispatch(push('/patients/visit'));

  await new Promise(resolve => setTimeout(resolve, 1000));

  dispatch({
    type: VISIT_LOAD_FINISH,
    visit: createDummyVisit({ _id: id }),
  });
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
