import React, { ReactElement, useEffect, useState } from 'react';

import { BackendManager } from '../../services/BackendManager';

import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';

export const BackendContext = React.createContext<BackendManager>(undefined);

let backendManager: BackendManager | null = null;

const getBackendManager = (): BackendManager => {
  if (!backendManager) {
    backendManager = new BackendManager();
  }
  return backendManager;
};

export const BackendProvider = ({ Component }): ReactElement => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      const manager = getBackendManager();
      manager.stopSyncService();
      setInitialised(false);

   
        await manager.initialise();
        setInitialised(true);
      
    })();
    return () => {
      const manager = getBackendManager();
      manager.stopSyncService();
    };
  }, []);

  if (!initialised) {
    return <LoadingScreen />;
  }

  const manager = getBackendManager();
  if (manager.getSyncError()) {
    return <ErrorScreen error={manager.getSyncError()} />;
  }

  return (
    <BackendContext.Provider value={manager}>
      <Component />
    </BackendContext.Provider>
  );
};
