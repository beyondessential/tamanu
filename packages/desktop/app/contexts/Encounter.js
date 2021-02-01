import React, { useState, useEffect, useContext } from 'react';
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

  useEffect(() => {
    const fetchEncounterData = async () => {
      setIsLoading(true);
      const data = await api.get(`encounter/${id}`);
      setEncounterData(data);
    };
    fetchEncounterData();
    setIsLoading(false);
  }, [id]);

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        isLoading,
        setEncounterId,
        setEncounterData,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};
