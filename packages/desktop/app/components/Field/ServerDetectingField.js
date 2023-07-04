import React, { useEffect, useState, useCallback, memo } from 'react';
import InputAdornment from '@material-ui/core/InputAdornment';

import { LOCAL_STORAGE_KEYS } from '../../constants';
import { TextField } from './TextField';
import { RefreshIconButton } from '../Button';

export function getSavedServer() {
  return window.localStorage.getItem(LOCAL_STORAGE_KEYS.HOST);
}

export const ServerDetectingField = memo(({ setFieldValue, ...props }) => {
  const [statusMessage, setStatusMessage] = useState('');

  const setHost = useCallback(host => setFieldValue(props.field.name, host), [
    setFieldValue,
    props.field.name,
  ]);

  const attemptServerDetection = useCallback(async () => {
    setStatusMessage('Detecting server, please wait...');
    try {
      const serverDetails = await discoverServer();
      console.log(serverDetails);
      if (!serverDetails) {
        setStatusMessage('Could not detect a server. Click retry or enter manually');
        return;
      }

      const { protocol, address, port } = serverDetails[0];
      const host = `${protocol}://${address}:${port}`;
      setHost(host);
      if (serverDetails.length === 1) {
        setStatusMessage();
      } else {
        setStatusMessage('Detected multiple running servers. Using the first to respond');
      }
    } catch (error) {
      setStatusMessage(error.message);
    }
  }, [setHost]);

  // attempt to detect on first mount
  useEffect(() => {
    const savedHost = getSavedServer();
    if (savedHost) {
      setHost(savedHost);
    } else {
      attemptServerDetection();
    }
  }, [setHost, attemptServerDetection]);

  return (
    <div>
      <TextField
        {...props}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <RefreshIconButton onClick={attemptServerDetection} />
            </InputAdornment>
          ),
        }}
      />
      <p>{statusMessage}</p>
    </div>
  );
});
