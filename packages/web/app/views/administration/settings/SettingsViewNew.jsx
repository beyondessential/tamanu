import React, { useState } from 'react';
import styled from 'styled-components';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  border-top: 1px solid #dededede;
`;

const TabContainer = styled.div`
  padding: 20px;
`;

const tabs = [
  {
    label: <TranslatedText stringId="admin.settings.settings.title" fallback="Settings" />,
    key: 'settings',
    icon: 'fa fa-cog',
    render: () => <TabContainer></TabContainer>,
  },
  {
    label: <TranslatedText stringId="admin.settings.jsonEditor.title" fallback="JSON editor" />,
    key: 'jsonEditor',
    icon: 'fa fa-code',
    render: () => <TabContainer></TabContainer>,
  },
];

export const SettingsViewNew = () => {
  const [currentTab, setCurrentTab] = useState('settings');

  return (
    <AdminViewContainer title="Settings">
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
      />
    </AdminViewContainer>
  );
};
