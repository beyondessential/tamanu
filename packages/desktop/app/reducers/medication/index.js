import { has } from 'lodash';
import request from './request';
import requests from './requests';

const stateChanges = { ...request, ...requests };
const initialState = {
  request: {},
  requestInProgress: false,
  saveRequestSuccess: false,
  deleteRequestSuccess: false,
  loading: false,
  medicationModel: {},
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
