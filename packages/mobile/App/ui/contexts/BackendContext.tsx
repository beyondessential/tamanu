import React, { ReactElement, useEffect, useState } from 'react';
import RnBgTask from 'react-native-bg-thread';
import { BackendManager } from '../../services/BackendManager';

import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { SYNC_EVENT_ACTIONS } from '../../services/sync/types';
import { queryClient } from '../queryClient';

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

  useEffect(() => {
    // Sync rewrites the local database underneath the query cache, so a completed sync
    // run is the one signal that any cached read may be stale. Queries use
    // staleTime: Infinity and rely on this bridge (plus mutation-driven invalidation)
    // for freshness.
    const onSyncEnded = (): void => {
      queryClient.invalidateQueries();
    };
    backendManager.syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ENDED, onSyncEnded);
    return () => {
      backendManager.syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_ENDED, onSyncEnded);
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
