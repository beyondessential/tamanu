import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

import { Colors } from '../../constants';
import { LargeButton, ContentPane, ConfirmCancelRow } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { useApi } from '../../api';
import { notifySuccess, notifyError } from '../../utils';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
  margin: 10px 0;
`;

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const saveSettings = () => {
    if (isJsonValid) {
      setSettings(JSON.parse(settingsEditString));
      toggleEditMode();
      api.put('admin/settings', JSON.parse(settingsEditString));
      notifySuccess('Settings saved');
    } else {
      notifyError('Invalid JSON');
    }
  };

  const onChange = newValue => {
    setSettingsEditString(newValue);
  };

  const checkValidJson = json => {
    try {
      JSON.parse(json);
    } catch (e) {
      return false;
    }
    return true;
  };

  const isJsonValid = checkValidJson(settingsEditString);

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings');
      setSettings(settingsObject);
      setSettingsEditString(JSON.stringify(settingsObject, null, 2));
    };
    fetchSettings();
  }, [api]);

  // TODO: Need to be able to delete keys from the settings object. Looks like some logic already on model but not working

  return (
    <AdminViewContainer title="Settings">
      <ContentPane>
        {editMode ? (
          <ConfirmCancelRow
            confirmDisabled={!isJsonValid}
            confirmText="Save"
            onConfirm={saveSettings}
            onCancel={toggleEditMode}
          />
        ) : (
          <LargeButton onClick={toggleEditMode}>Edit</LargeButton>
        )}
        <StyledAceEditor
          width="100%"
          height="600px"
          mode="json"
          theme={editMode ? 'github' : ''}
          onChange={onChange}
          value={editMode ? settingsEditString : JSON.stringify(settings, null, 2)}
          $isJsonValid={isJsonValid}
          showPrintMargin={false}
          readOnly={!editMode}
        />
        {/* {editMode ? (
          <StyledAceEditor
            width="100%"
            height="600px"
            mode="json"
            theme="github"
            onChange={onChange}
            value={settingsEditString}
            $isJsonValid={isJsonValid}
            showPrintMargin={false}
          />
        ) : (
          <StyledAceEditor
            width="100%"
            height="600px"
            value={JSON.stringify(settings, null, 2)}
            mode="json"
            readOnly
            highlightActiveLine={false}
            $isJsonValid={isJsonValid}
            showPrintMargin={false}
          />
        )} */}
      </ContentPane>
    </AdminViewContainer>
  );
});
