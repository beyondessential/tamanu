import { INCREMENT_COUNTER, DECREMENT_COUNTER } from '../actions/types';

export type counterStateType = {
  +counter: number
};

const initialState = {
  patients: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case INCREMENT_COUNTER:
      return {
        ...state,
        patients: action.payload,
      };
    case DECREMENT_COUNTER:
      return {
        ...state,
        patients: action.payload,
      };
    default:
      return state;
  }
};
