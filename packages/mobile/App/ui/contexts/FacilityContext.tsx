import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { readConfig, writeConfig } from '~/services/config';

interface FacilityContextData {
  facilityId?: string;
  facilityName: string;
  assignFacility: Function;
}

const FacilityContext = createContext({
  facilityId: null,
  facilityName: "Unmounted context",
});

export const useFacility = () => useContext(FacilityContext);
export const FacilityProvider = ({ children }) => {
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState('');

  useEffect(() => {
    if (facilityId) {
      setFacilityName(`fac-${facilityId}`);
    } else {
      setFacilityName("None");
    }
  }, [facilityId]);

  useEffect(() => {
    (async () => {
      const id = await readConfig('facilityId', '');
      if (id) {
        setFacilityId(id);
      }
    })();
  }, [setFacilityId]);

  const assignFacility = useCallback((id) => {
    setFacilityId(id);
    writeConfig('facilityId', id);  // don't need to await
  }, [setFacilityId]);

  return (
    <FacilityContext.Provider value={{
      facilityId,
      facilityName,
      assignFacility
    }}>
      {children}
    </FacilityContext.Provider>
  );
}
