import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DevSettings } from 'react-native';
import { readConfig, writeConfig } from '~/services/config';
import { useBackend } from '../hooks';

interface FacilityContextData {
  facilityId?: string;
  facilityName: string;
  assignFacility: (id: string, name: string) => Promise<void>;
}

const FacilityContext = createContext({
  facilityId: null,
  facilityName: 'Unmounted context',
  assignFacility: (id: string, name: string) => Promise.resolve(null),
});

export const useFacility = () => useContext(FacilityContext);
export const FacilityProvider = ({ children }) => {
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState('');
  const { models } = useBackend();

  useEffect(() => {
    (async () => {
      const id = await readConfig('facilityId', '');
      if (id) {
        setFacilityId(id);
        const facility = await models.Facility.findOne(id);
        if (!facility) {
          // Should only occur in the following scenarios:
          // 1. app was killed immediately after logging in, before it could sync facilities
          //   - should be fine, just a cosmetic issue that will clear up on its own after next sync
          // 2. facility was deleted on sync server
          //   - a problem, but nothing to do with this device
          //   - changing facilities is not supported anyway; the fix here is to reset the device db
          console.error(`Device was assigned to invalid facility, with id ${id}`);
          setFacilityName(id);
          return;
        }
        setFacilityName(facility.name);
      }
    })();
  }, [setFacilityId]);

  const assignFacility = useCallback((facilityId, facilityName) => {
    setFacilityId(facilityId);
    setFacilityName(facilityName);
    return writeConfig('facilityId', facilityId);
  }, [setFacilityId]);

  if (__DEV__) {
    DevSettings.addMenuItem('Clear facility', async () => {
      await assignFacility('', '');
      DevSettings.reload();
    });
  }

  return (
    <FacilityContext.Provider
      value={{
        facilityId,
        facilityName,
        assignFacility,
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
};
