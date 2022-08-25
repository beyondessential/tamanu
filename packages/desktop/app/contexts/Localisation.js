import React, { useState, useContext, useEffect } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

const overrides = {}; // add keys to this object to help with development

const LocalisationContext = React.createContext({
  getLocalisation: () => {},
});

export const useLocalisation = () => useContext(LocalisationContext);

export const DumbLocalisationProvider = ({ children, reduxLocalisation }) => {
  const [localisation, setLocalisation] = useState({});

  useEffect(() => {
    setLocalisation({ ...reduxLocalisation, ...overrides });
  }, [reduxLocalisation]);

  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation: path => get(localisation, path),
      }}
    >
      {children}
    </LocalisationContext.Provider>
  );
};

// we wrap this in a LocalisationProvider because it's a side effect of logging in
// and logging in is still handled within a redux reducer
export const LocalisationProvider = connect(({ auth: { localisation } }) => ({
  reduxLocalisation: localisation,
}))(DumbLocalisationProvider);
