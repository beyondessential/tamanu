import React, { useEffect, useState } from 'react';

import { LargeButton, ContentPane } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { JSONViewer, JSONEditor } from './components/JSONViewer';
import { useApi } from '../../api';

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings');
      setSettings(settingsObject);
    };
    fetchSettings();
  }, [api]);

  return (
    <AdminViewContainer title="Settings">
      <ContentPane>
        <LargeButton onClick={toggleEditMode}>{editMode ? 'Cancel' : 'Edit settings'}</LargeButton>
        {editMode && <LargeButton ml="1">Save</LargeButton>}
        {editMode ? <JSONEditor json={settings} /> : <JSONViewer json={settings} />}
      </ContentPane>
    </AdminViewContainer>
  );
});
