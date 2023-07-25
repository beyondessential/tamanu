import React, { useEffect, useState } from 'react';

import { LargeButton, ContentPane } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { JSONViewer } from './components/JSONViewer';
import { useApi } from '../../api';

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [editMode, setEditMode] = useState(false);
  const data = api.get('admin/settings');

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings');
      setSettings(settingsObject);
    };
    fetchSettings();
  }, [data, api]);

  return (
    <AdminViewContainer title="Settings">
      <ContentPane>
        <LargeButton onClick={toggleEditMode}>{editMode ? 'Cancel' : 'Edit settings'}</LargeButton>
        {editMode ? <p>edit mode</p> : <JSONViewer json={settings} />}
      </ContentPane>
    </AdminViewContainer>
  );
});
