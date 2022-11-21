import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { MobileSyncManager, SYNC_EVENT_ACTIONS } from '../../services/sync';

function stringifyError(e): string {
  const error = e.error || e;
  if (typeof error === 'string') return error;
  if (error.name || error.message) return `${error.name}: ${error.message}`;
  return JSON.stringify(e);
}

export const SyncErrorDisplay = (): ReactElement => {
  const [error, setError] = useState(null);
  const backend = useContext(BackendContext);
  const syncManager: MobileSyncManager = backend.syncManager;

  useEffect(() => {
    const errorHandler = ({ error: errorObject }): void => {
      setError(errorObject);
    };
    const errorResetHandler = (): void => {
      setError(null);
    };
    syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ERROR, errorHandler);
    syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_STARTED, errorResetHandler);
    return (): void => {
      syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_ERROR, errorHandler);
      syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_STARTED, errorResetHandler);
    };
  }, []);

  if (!error) {
    return null;
  }

  return (
    <StyledView
      marginTop={20}
      backgroundColor="rgba(247,104,83,0.2)"
      borderWidth={1}
      borderRadius={3}
      borderColor="#F76853"
    >
      <StyledView margin={8}>
        <StyledText color="#FFFFFF">{stringifyError(error)}</StyledText>
      </StyledView>
    </StyledView>
  );
};
