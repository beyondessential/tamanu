import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const overrides = {}; // add keys to this object to help with development

const LocalisationContext = React.createContext({
  getLocalisation: () => {},
});

export const useLocalisation = () => useContext(LocalisationContext);

export const LocalisationProvider = ({ children }) => {
  const [localisation, setLocalisation] = useState({});
  const reduxLocalisation = useSelector(state => state.auth.localisation);

  const getLocalisation = useCallback(
    path => {
      if (Array.isArray(path)) return path.map(p => get(localisation, p));
      return get(localisation, path);
    },
    [localisation],
  );

  useEffect(() => {
    setLocalisation({ ...reduxLocalisation, ...overrides });
  }, [reduxLocalisation]);

  return (
    <LocalisationContext.Provider value={{ getLocalisation }}>
      {children}
    </LocalisationContext.Provider>
  );
};

export const useConfig = path => {
  const { getLocalisation } = useLocalisation();
  return path ? getLocalisation(path) : undefined;
};

const featuresPath = 'features';

export const useFeatureFlag = path => {
  const { getLocalisation } = useLocalisation();
  const toFeaturePath = useCallback(p => `${featuresPath}.${p}`, []);

  // If !path, return entire features object
  if (!path) return getLocalisation(featuresPath);
  if (Array.isArray(path)) getLocalisation(path.map(toFeaturePath));
  return getLocalisation(toFeaturePath(path));
};
