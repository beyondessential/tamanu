import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-chrome';

import { Colors } from '../../constants';
import { LargeButton, ContentPane } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { useApi } from '../../api';
import { notifySuccess, notifyError } from '../../utils';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
  margin: 10px 0;
`;

const ValidationIndicator = styled.div`
  background-color: ${p => (p.$isJsonValid ? Colors.green : Colors.alert)};
  border: 1px solid ${Colors.outline};
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  color: white;
  height: 30px;
  width: 100px;
  margin-top: 10px;
  margin-left: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 1;
  right: 50px;
  top: 126px;
`;

const SaveButton = styled(LargeButton)`
  margin-left: 10px;
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

  return (
    <AdminViewContainer title="Settings">
      <ContentPane>
        <LargeButton onClick={toggleEditMode}>{editMode ? 'Cancel' : 'Edit'}</LargeButton>
        {editMode && (
          <SaveButton disabled={!isJsonValid} onClick={saveSettings}>
            Save
          </SaveButton>
        )}
        {editMode ? (
          <>
            <ValidationIndicator $isJsonValid={isJsonValid}>
              {isJsonValid ? 'Valid' : 'Invalid'}
            </ValidationIndicator>
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
          </>
        ) : (
          <StyledAceEditor
            width="100%"
            height="600px"
            mode="json"
            theme="chrome"
            value={JSON.stringify(settings, null, 2)}
            readOnly
            highlightActiveLine={false}
            $isJsonValid={isJsonValid}
            showPrintMargin={false}
          />
        )}
      </ContentPane>
    </AdminViewContainer>
  );
});
