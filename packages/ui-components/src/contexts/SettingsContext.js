import React, { useContext } from 'react';

export const SettingsContext = React.createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings has been called outside a SettingsProvider.');
  }
  return context;
};
