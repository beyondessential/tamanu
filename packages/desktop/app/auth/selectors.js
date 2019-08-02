export const checkIsLoggedIn = state => !!getCurrentUser(state);
export const getCurrentUser = ({ auth }) => auth.user;
