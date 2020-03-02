import { combineReducers } from 'redux';
import { reducer } from './patient';

export default combineReducers({
  patient: reducer,
});
