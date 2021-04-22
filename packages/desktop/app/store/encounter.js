import { push } from 'connected-react-router';

import { createReducer } from '../utils/createReducer';

// actions
const ENCOUNTER_LOAD_START = 'ENCOUNTER_LOAD_START';
const ENCOUNTER_LOAD_FINISH = 'ENCOUNTER_LOAD_FINISH';

export const viewEncounter = (id, modal) => async dispatch => {
  dispatch(reloadEncounter(id));
  dispatch(push(`/patients/encounter/${modal}`));
};

export const reloadEncounter = id => async (dispatch, getState, { api }) => {
  dispatch({ type: ENCOUNTER_LOAD_START, id });

  const [encounter, diagnoses] = await Promise.all([
    api.get(`encounter/${id}`),
    api.get(`encounter/${id}/diagnoses`),
  ]);

  // TODO handle error state

  dispatch({
    type: ENCOUNTER_LOAD_FINISH,
    encounter: {
      diagnoses: diagnoses.data,
      ...encounter,
    },
  });
};

// selectors

export const getDiagnoses = state => state.encounter.diagnoses || [];

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [ENCOUNTER_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [ENCOUNTER_LOAD_FINISH]: action => ({
    loading: false,
    ...action.encounter,
  }),
};

export const encounterReducer = createReducer(defaultState, handlers);
