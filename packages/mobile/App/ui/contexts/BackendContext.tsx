import React, { ReactElement, useEffect, useState } from 'react';

import { BackendManager } from '../../services/BackendManager';
import { runOnBackgroundThread } from '../../services/BackgroundThread';

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
    
    manager.stopSyncService();
    setInitialised(false);

    runOnBackgroundThread(async () => {
      await manager.initialise();
      setInitialised(true);
    });

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
