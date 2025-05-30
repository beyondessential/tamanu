import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get, merge } from 'lodash';

const overrides = {}; // add keys to this object to help with development

const LocalisationContext = React.createContext({
  getLocalisation: () => {},
});

export const useLocalisation = () => useContext(LocalisationContext);

export const LocalisationProvider = ({ children }) => {
  const [localisation, setLocalisation] = useState({});
  const reduxLocalisation = useSelector((state) => state.auth.localisation);
  useEffect(() => {
    setLocalisation(merge(reduxLocalisation, overrides));
  }, [reduxLocalisation]);

  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation: (path) => get(localisation, path),
        localisation,
      }}
    >
      {children}
    </LocalisationContext.Provider>
  );
};
