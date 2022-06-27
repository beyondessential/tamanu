import React, { useState, useContext } from 'react';
import { PATIENT_TAB_VALUES } from '../constants/patientNavigation';

const PatientTabContext = React.createContext({
  currentTab: PATIENT_TAB_VALUES.HISTORY,
});

export const usePatientTabs = () => useContext(PatientTabContext);

export const PatientTabProvider = ({ children }) => {
  const [currentTab, setCurrentTab] = useState(PATIENT_TAB_VALUES.HISTORY);

  return (
    <PatientTabContext.Provider
      value={{
        currentTab,
        setCurrentTab,
      }}
    >
      {children}
    </PatientTabContext.Provider>
  );
};
