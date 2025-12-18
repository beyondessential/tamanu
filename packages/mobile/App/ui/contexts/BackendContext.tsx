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
    const manager = getBackendManager();
    
    const initializeBackend = async (): Promise<void> => {
      manager.stopSyncService();
      setInitialised(false);
      
      await manager.initialise();
      setInitialised(true);
    };

    initializeBackend();

    return () => {
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
