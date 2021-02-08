import React, { useState, useEffect, useContext } from 'react';
import { push } from 'connected-react-router';
import { ApiContext } from '../api/singletons';

const EncounterContext = React.createContext({
  encounter: null,
  id: null,
  setEncounterId: () => {},
  setEncounterData: () => {},
  isLoading: false,
  setIsLoading: () => {},
  writeAndViewEncounter: () => {},
  fetchAndSetEncounterData: () => {},
  createAndViewEncounter: () => {},
  viewEncounter: () => {},
});

export const useEncounter = () => useContext(EncounterContext);

export const EncounterProvider = ({ store, children }) => {
  const [id, setEncounterId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [encounter, setEncounterData] = useState(null);

  const api = useContext(ApiContext);

  // write encounter data to the sync server.
  const saveEncounter = async (encounterId, data) => {
    await api.put(`encounter/${encounterId}`, data);
  };

  // get encounter data from the sync server and save it to state.
  const fetchAndSetEncounterData = async encounterId => {
    setIsLoading(true);
    setEncounterId(encounterId);
    const data = await api.get(`encounter/${encounterId}`);
    const { data: diagnoses } = await api.get(`encounter/${encounterId}/diagnoses`);
    const { data: procedures } = await api.get(`encounter/${encounterId}/procedures`);
    const { data: medications } = await api.get(`encounter/${encounterId}/medications`);
    setEncounterData({ ...data, diagnoses, procedures, medications });
    setIsLoading(false);
  };

  // navigate to the root encounter view which reads from encounter state.
  const viewEncounter = () => {
    store.dispatch(push(`/patients/encounter/`));
  };

  // write, fetch and set encounter then navigate to encounter view.
  const writeAndViewEncounter = async (encounterId, data) => {
    await saveEncounter(encounterId, data);
    await fetchAndSetEncounterData(encounterId);
    setEncounterId(encounterId);
    viewEncounter();
  };

  // create, fetch and set encounter then navigate to encounter view.
  const createAndViewEncounter = async data => {
    setIsLoading(true);
    const createdEncounter = await api.post(`encounter`, data);
    setEncounterId(createdEncounter.id);
    setIsLoading(false);
    viewEncounter();
  };

  // re-fetch encounter data every time the id is changed and save to state,
  // refreshing any rendered components using encounter state.
  useEffect(() => {
    (async () => {
      await fetchAndSetEncounterData(id);
    })();
  }, [id]);

  useEffect(() => {
    window.encounter = encounter;
  }, [encounter]);

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        isLoading,
        setEncounterId,
        writeAndViewEncounter,
        fetchAndSetEncounterData,
        createAndViewEncounter,
        viewEncounter,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};
