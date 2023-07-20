import React, { useState, useContext, useCallback } from 'react';
import { useApi } from '../api';

/*
  When loading an encounter, the user can't access the encounter view
  if they have permission to see related records (diagnoses, procedures, medications).

  This is a try/catch block wrapper that returns records or a default value.
*/
async function getDataOrDefaultOnError(getDataFn, defaultData) {
  try {
    const data = await getDataFn();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return defaultData;
  }
}

export const EncounterContext = React.createContext({
  encounter: null,
  setEncounterData: () => {},
  isLoadingEncounter: false,
  setIsLoadingEncounter: () => {},
  writeAndViewEncounter: () => {},
  loadEncounter: () => {},
  createEncounter: () => {},
});

export const useEncounter = () => useContext(EncounterContext);

export const EncounterProvider = ({ children }) => {
  const [isLoadingEncounter, setIsLoadingEncounter] = useState(false);
  const [encounter, setEncounterData] = useState(null);

  const api = useApi();

  // write encounter data to the sync server.
  const saveEncounter = async (encounterId, data) => {
    await api.put(`encounter/${encounterId}`, data);
  };

  // get encounter data from the sync server and save it to state.
  const loadEncounter = useCallback(
    async encounterId => {
      setIsLoadingEncounter(true);
      const data = await api.get(`encounter/${encounterId}`);
      const { data: diagnoses } = await getDataOrDefaultOnError(
        () => api.get(`encounter/${encounterId}/diagnoses`),
        { data: [] },
      );
      const { data: procedures } = await getDataOrDefaultOnError(
        () => api.get(`encounter/${encounterId}/procedures`),
        { data: [] },
      );
      const { data: medications } = await getDataOrDefaultOnError(
        () => api.get(`encounter/${encounterId}/medications`),
        { data: [] },
      );
      setEncounterData({ ...data, diagnoses, procedures, medications });
      setIsLoadingEncounter(false);
    },
    [api],
  );

  // write, fetch and set encounter.
  const writeAndViewEncounter = async (encounterId, data) => {
    await saveEncounter(encounterId, data);
    await loadEncounter(encounterId);
  };

  // create, fetch and set encounter then navigate to encounter view.
  const createEncounter = async data => {
    setIsLoadingEncounter(true);
    const createdEncounter = await api.post(`encounter`, data);
    await loadEncounter(createdEncounter.id);
    setIsLoadingEncounter(false);
    return createdEncounter;
  };

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        isLoadingEncounter,
        writeAndViewEncounter,
        loadEncounter,
        createEncounter,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};
