import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
export const SET_FORBIDDEN_ERROR = 'SET_FORBIDDEN_ERROR';
export const REMOVE_FORBIDDEN_ERROR = 'REMOVE_FORBIDDEN_ERROR';

export const setForbiddenError = error => ({
  type: SET_FORBIDDEN_ERROR,
  errorMessage: error?.message,
});

export const removeForbiddenError = () => ({
  type: REMOVE_FORBIDDEN_ERROR,
});

// selectors
export const getErrorMessage = state => state.specialModals.errorMessage;

// reducers
const defaultState = {
  errorMessage: null,
};

const handlers = {
  [REMOVE_FORBIDDEN_ERROR]: () => ({
    errorMessage: null,
  }),
  [SET_FORBIDDEN_ERROR]: action => ({
    errorMessage: action.error,
  }),
};

export const specialModalsReducer = createStatePreservingReducer(defaultState, handlers);
