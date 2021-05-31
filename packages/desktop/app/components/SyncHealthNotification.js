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
  const [response, setResponse] = useState();

  useEffect(() => {
    (async () => {
      const message = await api.get('syncHealth');
      setResponse(message);
    })();
  }, []);

  // We only get a response if the request returns a 422 error,
  // so we can safely render nothing until we have a value in response.
  if (!response) return <></>;

  return (
    <Container>
      <h3>Sync Health: Unable to sync</h3>
      <p>{`${response}`}</p>
    </Container>
  );
};
