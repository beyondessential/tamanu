import React, { useState, useEffect, ReactElement } from 'react';
import RnBgTask from 'react-native-bg-thread';
import { Backend } from '~/services/backend';

import { LoadingScreen } from '~/ui/components/LoadingScreen';

export const BackendContext = React.createContext<Backend>(undefined);

const backend = new Backend();

export const BackendProvider = ({ Component }): ReactElement => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      backend.stopSyncService();
      setInitialised(false);

      RnBgTask.runInBackground(async () => {
        await backend.initialise();
        setInitialised(true);
      });
    })();
    return () => { 
      backend.stopSyncService(); 
    };
  }, [backend]);

  if (!initialised) {
    return <LoadingScreen />;
  }

  return (
    <BackendContext.Provider value={backend}>
      <Component />
    </BackendContext.Provider>
  );
};
