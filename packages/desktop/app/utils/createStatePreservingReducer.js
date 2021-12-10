/**
 * Helper function that returns a reducer based on an object that contains an entry for each action
 * type, with a function that describes what changes to state that action would cause. Assumes action
 * */
export const createStatePreservingReducer = (defaultState = {}, actionHandlers = {}) => (
  state = defaultState,
  action,
) => {
  const { type, ...payload } = action;

  // if this reducer supplied an action handler for this action type, use it
  if (type && actionHandlers && Object.prototype.hasOwnProperty.call(actionHandlers, type)) {
    return {
      ...state,
      ...actionHandlers[type](payload, state),
    };
  }

  // action type didn't match a change or a manipulator, return original state
  return state;
};
