import React, { useEffect, useState, memo } from 'react';
import InputAdornment from '@material-ui/core/InputAdornment';

import { discoverServer } from '../../api/discovery';
import { TextField } from './TextField';
import { RefreshIconButton } from '../Button';

export const ServerDetectingField = memo(({ setFieldValue, ...props }) => {
  const [statusMessage, setStatusMessage] = useState('');

  const attemptServerDetection = async () => {
    setStatusMessage('Detecting server, please wait...');
    try {
      const serverDetails = await discoverServer();
      if (!serverDetails) {
        setStatusMessage('Could not detect a server. Click retry or enter manually');
        return;
      }

      const { protocol, address, port } = serverDetails;
      const host = `${protocol}://${address}:${port}`;
      setFieldValue(props.field.name, host);
      setStatusMessage();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  // attempt to detect on first mount
  useEffect(() => {
    attemptServerDetection();
  }, []);

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
