import {
  CREATE_LAB_REQUEST,
  CREATE_LAB_SUCCESS,
  CREATE_LAB_FAILED,
  FETCH_LABS_REQUEST,
  FETCH_LABS_SUCCESS,
  FETCH_LABS_FAILED,
} from './types';
import { idGenerator } from '../constants';

export function createLabRequest() {
  return {
    type: CREATE_LAB_REQUEST
  };
}

export function createLabSuccess(lab) {
  return {
    type: CREATE_LAB_SUCCESS,
    payload: lab
  };
}

export function createLabFailed() {
  return {
    type: CREATE_LAB_FAILED
  };
}

export function fetchLabsRequest() {
  return {
    type: FETCH_LABS_REQUEST
  };
}

export function fetchLabsSuccess(labs) {
  return {
    type: FETCH_LABS_SUCCESS,
    payload: labs
  };
}

export function fetchLabsFailed() {
  return {
    type: FETCH_LABS_FAILED
  };
}

export const createLab = lab => {
  return dispatch => {
    dispatch(createLabRequest());
    const existingLabs = JSON.parse(localStorage.getItem('labs')) || [];
    const labInfo = lab;
    labInfo.id = idGenerator();
    existingLabs.push(labInfo);
    localStorage.setItem('labs', JSON.stringify(existingLabs));
  };
};

export const fetchLabs = () => {
  return dispatch => {
    dispatch(fetchLabsRequest());
    const existingLabs = JSON.parse(localStorage.getItem('labs')) || [];
    dispatch(fetchLabsSuccess(existingLabs));
  };
};
