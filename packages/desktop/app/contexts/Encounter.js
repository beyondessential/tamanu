import React, { useState, useContext } from 'react';
import { useApi } from '../api';

const EncounterContext = React.createContext({
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
  const loadEncounter = async encounterId => {
    setIsLoadingEncounter(true);
    const data = await api.get(`encounter/${encounterId}`);
    const { data: diagnoses } = await api.get(`encounter/${encounterId}/diagnoses`);
    const { data: procedures } = await api.get(`encounter/${encounterId}/procedures`);
    const { data: medications } = await api.get(`encounter/${encounterId}/medications`);
    setEncounterData({ ...data, diagnoses, procedures, medications });
    setIsLoadingEncounter(false);
    window.encounter = encounter;
  };

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
