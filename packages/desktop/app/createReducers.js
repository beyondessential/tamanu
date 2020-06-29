import { connectRouter } from 'connected-react-router';

import {
  authReducer,
  patientReducer,
  encounterReducer,
  optionsReducer,
  labRequestReducer,
  imagingRequestReducer,
  decisionSupportReducer,
} from './store';

export const createReducers = history => ({
  router: connectRouter(history),
  auth: authReducer,
  patient: patientReducer,
  encounter: encounterReducer,
  options: optionsReducer,
  labRequest: labRequestReducer,
  imagingRequest: imagingRequestReducer,
  decisionSupport: decisionSupportReducer,
});
