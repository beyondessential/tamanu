import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
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
  const [index, setIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const backend = useContext(BackendContext);
  const syncManager: MobileSyncManager = backend.syncManager;

  useEffect(() => {
    setErrorCount(syncManager.errors.length);
    const errorHandler = ({ error }): void => {
      setErrorMessage(`Failed to sync with ${error}`);
      setErrorCount(syncManager.errors.length);
    };
    const errorResetHandler = (): void => {
      setErrorMessage('');
      setErrorCount(syncManager.errors.length); // should be zero
    };
    syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ERROR, errorHandler);
    syncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_STARTED, errorResetHandler);
    return (): void => {
      syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_ERROR, errorHandler);
      syncManager.emitter.off(SYNC_EVENT_ACTIONS.SYNC_STARTED, errorResetHandler);
    };
  }, []);

  const onPress = (p): void => {
    const assumedWidth = 350; // TODO get real element width
    const margin = assumedWidth * 0.25;
    if (p.nativeEvent.locationX < margin) {
      setIndex(Math.max(0, index - 1));
    } else if (p.nativeEvent.locationX > (assumedWidth - margin)) {
      setIndex(Math.min(errorCount - 1, index + 1));
    }
  };

  if (errorCount === 0) {
    return null;
  }

  let error = null;
  if (index < errorCount) {
    error = syncManager.errors[index];
  }

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <StyledView marginTop={10} backgroundColor="#441111">
        <StyledView margin={8}>
          <StyledText color="white">{errorMessage}</StyledText>
          <StyledText color="white">{`Error ${index + 1}/${errorCount}`}</StyledText>
          {error
            ? (
              <StyledView>
                <StyledText color="red">{stringifyError(error)}</StyledText>
                {error.record && <StyledText color="white">{JSON.stringify(error.record)}</StyledText>}
              </StyledView>
            )
            : <StyledText>No error</StyledText>
          }
        </StyledView>
      </StyledView>
    </TouchableWithoutFeedback>
  );
};
