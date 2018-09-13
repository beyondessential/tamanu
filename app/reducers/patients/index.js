import moment from 'moment';
import { has } from 'lodash';
import patients from './patients';
import visits from './visits';
import procedures from './procedures';

const stateChanges = { ...patients, ...visits, ...procedures };
const initialState = {
  patient: {},
  patientInProgress: false,
  createPatientSuccess: false,
  deletePatientSuccess: false,
  updatedBirthday: moment(),
  updatedReferredDate: moment(),
  visit: {},
  procedure: {},
  action: '',
  saved: false,
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
