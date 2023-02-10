import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { 
  reloadPatient as reduxReloadPatient,
  syncPatient as reduxSyncPatient,
} from '../store';

const PatientContext = React.createContext({
  patient: null,
  loadPatient: (id) => {},
  reloadPatient: () => {},
  syncPatient: () => {},
});

export const usePatient = () => useContext(PatientContext);

export const PatientProvider = ({ children }) => {
  const patient = useSelector(state => state.patient);
  
  const dispatch = useDispatch();
  const loadPatient = id => dispatch(reduxReloadPatient(id));
  const reloadPatient = () => dispatch(reduxReloadPatient());
  const syncPatient = () => dispatch(reduxSyncPatient());
  
  return (
    <PatientContext.Provider
      value={{
        patient,
        loadPatient,
        reloadPatient,
        syncPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
