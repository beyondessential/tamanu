// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import patients from './patients';
import medications from './medications';

const rootReducer = combineReducers({
  patients,
  router,
  medications
});

export default rootReducer;
