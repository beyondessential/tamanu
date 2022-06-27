import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { ApiContext } from '../api';
import { Colors } from '../constants';

const Container = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  text-align: center;
  margin: auto auto;
  width: 100%;
  padding: 10px;
  h3,
  p {
    margin: 0;
  }
  background: ${Colors.alert};
`;

export const SyncHealthNotificationComponent = () => {
  const api = useContext(ApiContext);
  const [message, setMessage] = useState();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await api.get('syncHealth');
      if (!isMounted) return;
      if (!res.healthy) {
        setMessage(res.error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [api]);

  // We only set a message if the server is unhealthy, so as long as message is undefined,
  // we don't need to render a warning.
  if (!message) return null;

  return (
    <Container>
      <h3>Sync Health: Unable to sync</h3>
      <p>{`${message}`}</p>
    </Container>
  );
};
