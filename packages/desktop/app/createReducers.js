import { connectRouter } from 'connected-react-router';

import {
  authReducer,
  patientReducer,
  optionsReducer,
  labRequestReducer,
  imagingRequestReducer,
  decisionSupportReducer,
} from './store';

export const createReducers = history => ({
  router: connectRouter(history),
  auth: authReducer,
  patient: patientReducer,
  options: optionsReducer,
  labRequest: labRequestReducer,
  imagingRequest: imagingRequestReducer,
  decisionSupport: decisionSupportReducer,
});
