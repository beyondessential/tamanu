import React, { useState } from 'react';
import styled from 'styled-components';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { JSONEditorView } from './JSONEditorView';
import { useAuth } from '../../../contexts/Auth';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  border-top: 1px solid #dededede;
`;

const TabContainer = styled.div`
  padding: 20px;
`;

const tabs = [
  {
    label: <TranslatedText stringId="admin.settings.settings.title" fallback="Editor" />,
    key: 'editor',
    icon: 'fa fa-cog',
    render: () => (
      <TabContainer>
        <p>GUI starts here</p>
      </TabContainer>
    ),
  },
  {
    label: <TranslatedText stringId="admin.settings.jsonEditor.title" fallback="JSON editor" />,
    key: 'json',
    icon: 'fa fa-code',
    render: () => (
      <TabContainer>
        <JSONEditorView />
      </TabContainer>
    ),
  },
];

export const SettingsView = () => {
  const [currentTab, setCurrentTab] = useState('editor');
  const { ability } = useAuth();
  // Placeholder for permissions
  const canViewJSONEditor = ability.can('write', 'Settings');

  return (
    <AdminViewContainer
      title={<TranslatedText stringId="admin.settings.title" fallback="Settings" />}
    >
      {canViewJSONEditor ? (
        <StyledTabDisplay
          tabs={tabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          scrollable={false}
        />
      ) : (
        <p>GUI starts here</p>
      )}
    </AdminViewContainer>
  );
};
