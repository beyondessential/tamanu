import React, { useState, useContext } from 'react';
import { push } from 'connected-react-router';
import { ApiContext } from '../api/singletons';

const EncounterContext = React.createContext({
  encounter: null,
  setEncounterData: () => {},
  loadingEncounter: false,
  setIsLoading: () => {},
  writeAndViewEncounter: () => {},
  loadEncounter: () => {},
  createEncounter: () => {},
  viewEncounter: () => {},
});

export const useEncounter = () => useContext(EncounterContext);

export const EncounterProvider = ({ store, children }) => {
  const [loadingEncounter, setLoadingEncounter] = useState(false);
  const [encounter, setEncounterData] = useState(null);

  const api = useContext(ApiContext);

  // write encounter data to the sync server.
  const saveEncounter = async (encounterId, data) => {
    await api.put(`encounter/${encounterId}`, data);
  };

  // get encounter data from the sync server and save it to state.
  const loadEncounter = async encounterId => {
    setLoadingEncounter(true);
    const data = await api.get(`encounter/${encounterId}`);
    const { data: diagnoses } = await api.get(`encounter/${encounterId}/diagnoses`);
    const { data: procedures } = await api.get(`encounter/${encounterId}/procedures`);
    const { data: medications } = await api.get(`encounter/${encounterId}/medications`);
    setEncounterData({ ...data, diagnoses, procedures, medications });
    setLoadingEncounter(false);
    window.encounter = encounter;
  };

  // navigate to the root encounter view which reads from encounter state.
  const viewEncounter = () => {
    store.dispatch(push(`/patients/encounter/`));
  };

  // write, fetch and set encounter then navigate to encounter view.
  const writeAndViewEncounter = async (encounterId, data) => {
    await saveEncounter(encounterId, data);
    await loadEncounter(encounterId);
    viewEncounter();
  };

  // create, fetch and set encounter then navigate to encounter view.
  const createEncounter = async data => {
    setLoadingEncounter(true);
    const createdEncounter = await api.post(`encounter`, data);
    await loadEncounter(createdEncounter.id);
    viewEncounter();
    setLoadingEncounter(false);
    return createdEncounter;
  };

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        loadingEncounter,
        writeAndViewEncounter,
        loadEncounter,
        createEncounter,
        viewEncounter,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};
