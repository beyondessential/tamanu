import { has } from 'lodash';
import request from './request';

const stateChanges = { ...request };
const initialState = {
  request: {},
  requestInProgress: false,
  saveRequestSuccess: false,
  deleteRequestSuccess: false,
  loading: false,
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
