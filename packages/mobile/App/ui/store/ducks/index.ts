import { combineReducers } from 'redux';
import { patientReducer } from './patient';
import { authReducer } from './auth';

export default combineReducers({
  patient: patientReducer,
  auth: authReducer,
});
