import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ApiContext } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from './Translation/TranslatedText';
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
  const { currentUser } = useAuth();
  const [message, setMessage] = useState();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // don't attempt to get syncHealth when not logged in
      if (!currentUser) return;
      const res = await api.get('syncHealth');
      if (!isMounted) return;
      if (!res.healthy) {
        setMessage(res.error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [api, currentUser]);

  // We only set a message if the server is unhealthy, so as long as message is undefined,
  // we don't need to render a warning.
  if (!message) return null;

  return (
    <Container data-testid="container-jeb9">
      <h3>
        <TranslatedText
          stringId="syncHealth.notification.title"
          fallback="Sync Health: Unable to sync"
          data-testid="translatedtext-sync-health-title"
        />
      </h3>
      <p>{`${message}`}</p>
    </Container>
  );
};
