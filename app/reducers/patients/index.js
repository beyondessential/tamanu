import moment from 'moment';
import { has } from 'lodash';
import patients from './patients';
import visits from './visits';

const stateChanges = { ...patients, ...visits };
const initialState = {
  patient: {},
  patientInProgress: false,
  createPatientSuccess: false,
  deletePatientSuccess: false,
  updatedBirthday: moment(),
  updatedReferredDate: moment(),
  visit: {},
  action: '',
  saved: false,
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
