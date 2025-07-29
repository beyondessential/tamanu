import React, { ReactElement, useEffect, useState } from 'react';
import RnBgTask from 'react-native-bg-thread';
import { v4 as uuidv4 } from 'uuid';

import { BackendManager } from '../../services/BackendManager';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { readConfig, writeConfig } from '~/services/config';

export const BackendContext = React.createContext<BackendManager>(undefined);

const backendManager = new BackendManager();

export const BackendProvider = ({ Component }): ReactElement => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      backendManager.stopSyncService();
      setInitialised(false);

      const deviceId = await readConfig('deviceId');
      if (!deviceId) {
        const newDeviceId = `mobile-${uuidv4()}`;
        await writeConfig('deviceId', newDeviceId);
      }

      RnBgTask.runInBackground(async () => {
        await backendManager.initialise(deviceId);
        setInitialised(true);
      });
    })();
    return () => {
      backendManager.stopSyncService();
    };
  }, []);

  if (!initialised) {
    return <LoadingScreen />;
  }

  if (backendManager.getSyncError()) {
    return <ErrorScreen error={backendManager.getSyncError()} />;
  }

  return (
    <BackendContext.Provider value={backendManager}>
      <Component />
    </BackendContext.Provider>
  );
};
