import React, { ReactElement, useEffect, useState } from 'react';

import { BackendManager } from '../../services/BackendManager';

import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';

export const BackendContext = React.createContext<BackendManager>(undefined);

const backendManager = new BackendManager();

export const BackendProvider = ({ Component }): ReactElement => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      backendManager.stopSyncService();
      setInitialised(false);

   
        await backendManager.initialise();
        setInitialised(true);
      
    })();
    return () => {
      backendManager.stopSyncService();
    };
  }, [backendManager]);

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
