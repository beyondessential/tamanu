import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
export const PUSH_DECISION_SUPPORT = 'PUSH_DECISION_SUPPORT';
export const POP_DECISION_SUPPORT = 'POP_DECISION_SUPPORT';

export const showDecisionSupport = (decisionSupportType, extraInfo) => ({
  type: PUSH_DECISION_SUPPORT,
  decisionSupportType,
  extraInfo,
});

// selectors

export const getCurrentDecisionSupport = state => state.decisionSupport.messages[0];

// reducers

const defaultState = {
  messages: [],
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
};

export const decisionSupportReducer = createStatePreservingReducer(defaultState, handlers);
