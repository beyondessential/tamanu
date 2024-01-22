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
    (lastPull, lastPush) => {
      // To tell if a patient and all the relevant records have been synced,
      // there are 2 things we have to check:
      //
      // 1. If patient_facility has been pushed to central successfully
      //    (we can check this by checking if lastPush > the patient_facility's
      //    sync tick, meaning that the patient_facility has been included in the push)
      //
      // 2. If the pull in the same session as the push of patient_facility in the
      //    above point has also finished - meaning that all the records of that
      //    patient have been pulled down (we can check this by checking if
      //    lastSuccessfulSyncPull > lastSuccessfulSyncPush)
      const hasPushedAndPulled = p => lastPush > p.tick && lastPull > lastPush;
      setCurrentSyncingPatients(currentSyncingPatients.filter(hasPushedAndPulled));
    },
    [currentSyncingPatients],
  );

  // query the facility server for sync status
  const querySync = useCallback(async () => {
    const status = await api.get('/sync/status');
    setSyncStatus(status);
    clearSyncingPatients(status.lastCompletedPull, status.lastCompletedPush);
  }, [api, clearSyncingPatients]);

  // effect to poll sync status while there are pending patient syncs
  useEffect(() => {
    // don't poll if there are no syncing patients
    if (currentSyncingPatients.length === 0) return () => {};

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
