import React, { useContext } from 'react';

export const AuthContext = React.createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth has been called outside a AuthProvider.');
  }
  return context;
};
