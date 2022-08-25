import React, { useState, useEffect, ReactElement } from 'react';
import RnBgTask from 'react-native-bg-thread';
import { BackendManager } from '~/services/BackendManager';

import { LoadingScreen } from '~/ui/components/LoadingScreen';

export const BackendContext = React.createContext<BackendManager>(undefined);

const backendManager = new BackendManager();

export const BackendProvider = ({ Component }): ReactElement => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      backendManager.stopSyncService();
      setInitialised(false);

      RnBgTask.runInBackground(async () => {
        await backendManager.initialise();
        setInitialised(true);
      });
    })();
    return () => {
      backendManager.stopSyncService(); 
    };
  }, [backendManager]);

  if (!initialised) {
    return <LoadingScreen />;
  }

  return (
    <BackendContext.Provider value={backendManager}>
      <Component />
    </BackendContext.Provider>
  );
};
