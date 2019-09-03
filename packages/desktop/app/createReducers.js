import { connectRouter } from 'connected-react-router';

import {
  authReducer,
  patientReducer,
  visitReducer,
  optionsReducer,
  labRequestReducer,
} from './store';

export const createReducers = history => ({
  router: connectRouter(history),
  auth: authReducer,
  patient: patientReducer,
  visit: visitReducer,
  options: optionsReducer,
  labRequest: labRequestReducer,
});
