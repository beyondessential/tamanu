import React, { useState, useContext } from 'react';
import { push } from 'connected-react-router';
import { useApi } from '../api';

const FacilityContext = React.createContext({});

export const useFacility = () => useContext(FacilityContext);
export const FacilityProvider = ({ children }) => {
  const [facilityInfo, setFacilityInfo] = useState({});

  return (
    <FacilityContext.Provider
      value={{
        ...facilityInfo,
        setFacilityInfo,
      }}
      children={children}
    />
  );
};
