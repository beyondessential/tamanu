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
    console.log('Triggering manual sync on LAN server');
    try {
      await api.post(`sync/run`);
      console.log('Manual sync complete');
    } catch (e) {
      console.log('Manual sync failed');
    }
  },
}))(InvisibleButton);

export const NotActiveView = React.memo(() => {
  return (
    <React.Fragment>
      <TopBar title="Not Active Yet" />
      <Notification message="This section is not activated yet." />
      <InvisibleSyncButton />
    </React.Fragment>
  );
});
