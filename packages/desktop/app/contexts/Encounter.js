import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ApiContext } from '../api/singletons';

const EncounterContext = React.createContext({
  encounter: null,
  id: null,
  isLoading: false,
  setEncounter: () => {},
  setEncounterData: () => {},
});

export const useEncounter = () => useContext(EncounterContext);

export const EncounterProvider = ({ children }) => {
  const [id, setEncounterId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [encounter, setEncounterData] = useState(null);

  const api = useContext(ApiContext);

  const fetchData = useCallback(async () => {
    const fetchEncounterData = async () => {
      setIsLoading(true);
      const data = await api.get(`encounter/${id}`);
      const diagnoses = await api.get(`encounter/${id}/diagnoses`);
      const procedures = await api.get(`encounter/${id}/procedures`);
      const medications = await api.get(`encounter/${id}/medications`);
      setEncounterData({
        ...data,
        diagnoses: diagnoses.data,
        procedures: procedures.data,
        medications: medications.data,
      });
    };
    fetchEncounterData();
    setIsLoading(false);
  }, id);

  useEffect(() => {
    fetchData();
    setIsLoading(false);
  }, [id]);

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        isLoading,
        setEncounterId,
        fetchData,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};
