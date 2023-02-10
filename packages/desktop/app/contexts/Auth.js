import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store';

const AuthContext = React.createContext({
  currentUser: {},
  isLoggedIn: false,
  ability: {},
  facility: {},
  centralHost: '',
  onLogout: () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  const reduxState = useSelector(state => ({
    currentUser: state.auth?.user,
    isLoggedIn: !!(state.auth?.user),
    ability: state.auth?.ability,
    facility: state.auth?.server?.facility || {},
    centralHost: state.auth?.server?.centralHost,
  }));

  return (
    <AuthContext.Provider
      value={{
        ...reduxState,
        onLogout: () => dispatch(logout()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
