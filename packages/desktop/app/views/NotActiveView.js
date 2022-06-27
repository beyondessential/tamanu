import React from 'react';
import styled from 'styled-components';
import { connectApi } from '../api';

import { TopBar, Notification } from '../components';

// adding an invisible button as a hack to allow manually triggering a sync
const InvisibleButton = styled.div`
  height: 300px;
  width: 300px;
`;
const InvisibleSyncButton = connectApi(api => ({
  onClick: async () => {
    // eslint-disable-next-line no-console
    console.log('Triggering manual sync on LAN server');
    try {
      await api.post(`sync/run`);
      // eslint-disable-next-line no-console
      console.log('Manual sync complete');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Manual sync failed');
    }
  },
}))(InvisibleButton);

export const NotActiveView = React.memo(() => (
  <>
    <TopBar title="Not active yet" />
    <Notification message="This section is not activated yet." />
    <InvisibleSyncButton />
  </>
));
