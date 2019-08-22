

// actions and reducers are provided by connected-react-router


// selectors

export const getCurrentRoute = state => state.router.location.pathname;

export const getCurrentRouteEndsWith = (state, suffix) =>
  getCurrentRoute(state).endsWith(suffix);
