import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { DevSettings } from 'react-native';
import { readConfig, writeConfig } from '~/services/config';

interface FacilityContextData {
  facilityId?: string;
  facilityName: string;
  assignFacility: (id: string) => Promise<void>;
}

const FacilityContext = createContext({
  facilityId: null,
  facilityName: "Unmounted context",
  assignFacility: (id: string) => Promise.resolve(null),
});

export const useFacility = () => useContext(FacilityContext);
export const FacilityProvider = ({ children }) => {
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState('');

  useEffect(() => {
    if (facilityId) {
      // TODO: get real facility name
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
    return writeConfig('facilityId', id);
  }, [setFacilityId]);

  if (__DEV__) {
    DevSettings.addMenuItem('Clear facility', async () => {
      await assignFacility('');
      DevSettings.reload();
    });
  }

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
