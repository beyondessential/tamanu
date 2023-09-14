import React, { createContext, useCallback, useState, useEffect, useContext } from 'react';
import { useApi } from '../api';

export const SyncStateContext = createContext({
  addSyncingPatient: () => null,
  clearSyncingPatients: () => null,
  isPatientSyncing: () => false,
  syncStatus: {},
});

export const useSyncState = () => useContext(SyncStateContext);

export const SyncStateProvider = ({ children }) => {
  const [currentSyncingPatients, setCurrentSyncingPatients] = useState([]);
  const [syncStatus, setSyncStatus] = useState({});
  const api = useApi();

  // functions to manage the list of currently-syncing patients
  // usually this will only be one or two but in cases of high usage & slow network,
  // it could be a few
  const addSyncingPatient = useCallback(
    (patientId, tick) => {
      setCurrentSyncingPatients([...currentSyncingPatients, { patientId, tick }]);
    },
    [currentSyncingPatients],
  );

  const isPatientSyncing = useCallback(
    patientId => {
      return currentSyncingPatients.some(p => p.patientId === patientId);
    },
    [currentSyncingPatients],
  );

  const clearSyncingPatients = useCallback(
    tick => {
      setCurrentSyncingPatients(currentSyncingPatients.filter(p => p.tick < tick));
    },
    [currentSyncingPatients],
  );

  // query the facility server for sync status
  const querySync = useCallback(async () => {
    const status = await api.get('/sync/status');
    setSyncStatus(status);
    clearSyncingPatients(status.lastCompletedSyncTick);
  }, [api, clearSyncingPatients]);

  // effect to poll sync status while there are pending patient syncs
  useEffect(() => {
    // don't poll if there are no syncing patients
    if (currentSyncingPatients.length === 0) return null;

    // poll every 2 seconds
    const pollInterval = setInterval(() => {
      querySync();
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [querySync, currentSyncingPatients]);

  return (
    <SyncStateContext.Provider
      value={{
        syncStatus,
        addSyncingPatient,
        isPatientSyncing,
        clearSyncingPatients,
      }}
    >
      {children}
    </SyncStateContext.Provider>
  );
};
