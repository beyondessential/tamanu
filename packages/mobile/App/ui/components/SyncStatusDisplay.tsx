import React, { useCallback, useState, useEffect } from 'react';
import { StyledView, StyledText } from '~/ui/styled/common';
import { useBackend } from '~/ui/hooks';

function getMessageForEvent(event, params) {
  switch (event) {
    case 'syncStarted':
      return 'Syncing...';
    case 'syncEnded':
      return ''; // clear message
    case 'referenceDownloadStarted':
      return 'Downloading new reference data...';
    case 'syncedRecord':
      return `Synced ${params[0].recordType}...`;
    case 'syncedPatient':
      return 'Synced patient...';
    default:
      return null;
  }
}

export const SyncStatusDisplay = ({}) => {
  const { syncManager } = useBackend();

  const [stateMessage, setStateMessage] = useState('');
  const handler = useCallback((event, ...params) => {
    const message = getMessageForEvent(event, params);
    if (message === null) return;
    setStateMessage(message);
  });

  useEffect(() => {
    syncManager.emitter.on('*', handler);
    return () => syncManager.emitter.off('*', handler);
  });

  if (!stateMessage) return null;

  return (
    <StyledView background="#ccc">
      <StyledText textAlign="center">
        { stateMessage }
      </StyledText>
    </StyledView>
  );
};
