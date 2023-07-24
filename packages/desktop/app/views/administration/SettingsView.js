import React from 'react';

import { TopBar, PageContainer, ContentPane } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';

export const SettingsView = React.memo(() => {
  return (
    <AdminViewContainer title="Settings">
      <ContentPane>
        <p>Settings go here</p>
      </ContentPane>
    </AdminViewContainer>
  );
});
