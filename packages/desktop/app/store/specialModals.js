import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
export const PUSH_DECISION_SUPPORT = 'PUSH_DECISION_SUPPORT';
export const POP_DECISION_SUPPORT = 'POP_DECISION_SUPPORT';
export const SET_FORBIDDEN_ERROR = 'SET_FORBIDDEN_ERROR';
export const REMOVE_FORBIDDEN_ERROR = 'REMOVE_FORBIDDEN_ERROR';

export const showDecisionSupport = (decisionSupportType, extraInfo) => ({
  type: PUSH_DECISION_SUPPORT,
  decisionSupportType,
  extraInfo,
});

export const setForbiddenError = error => ({
  type: SET_FORBIDDEN_ERROR,
  errorMessage: error?.message,
});

export const removeForbiddenError = () => ({
  type: REMOVE_FORBIDDEN_ERROR,
});

// selectors

export const getCurrentDecisionSupport = state => state.specialModals.messages[0];
export const getErrorMessage = state => state.specialModals.errorMessage;

// reducers

const defaultState = {
  messages: [],
  errorMessage: null,
};

const handlers = {
  [POP_DECISION_SUPPORT]: () => ({
    messages: [],
  }),
  [PUSH_DECISION_SUPPORT]: action => ({
    messages: [
      {
        ...action,
      },
    ],
  }),
  [REMOVE_FORBIDDEN_ERROR]: () => ({
    errorMessage: null,
  }),
  [SET_FORBIDDEN_ERROR]: action => ({
    errorMessage: action.error,
  }),
};

export const specialModalsReducer = createStatePreservingReducer(defaultState, handlers);
