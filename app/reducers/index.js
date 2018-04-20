// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import patients from './patients';

const rootReducer = combineReducers({
  patients,
  router,
});

export default rootReducer;
