import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { LargeButton, TextButton, ContentPane, ButtonRow, TopBar } from '../../../components';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { JSONEditor } from './JSONEditor';
import { ScopeSelector } from './ScopeSelector';
import { DefaultSettingsModal } from './DefaultSettingsModal';
import { useApi } from '../../../api';
import { notifySuccess, notifyError } from '../../../utils';

const StyledTopBar = styled(TopBar)`
  padding: 0;
`;

const DefaultSettingsButton = styled(TextButton)`
  font-size: 14px;
  white-space: nowrap;
  margin-left: 10px;
  .MuiSvgIcon-root {
    margin-right: 5px;
  }
`;

const getScope = selectedFacility => {
  switch (selectedFacility) {
    case SETTINGS_SCOPES.CENTRAL:
      return SETTINGS_SCOPES.CENTRAL;
    case null:
      return SETTINGS_SCOPES.GLOBAL;
    default:
      return SETTINGS_SCOPES.FACILITY;
  }
};

const buildSettingsString = settings => {
  return JSON.stringify(settings, null, 2);
};

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const areSettingsPresent = Object.keys(settings).length > 0;
  const settingsViewString = areSettingsPresent ? buildSettingsString(settings) : '';
  const hasSettingsChanged = settingsViewString !== settingsEditString;
  const scope = getScope(selectedFacility);

  const updateSettingsEditString = value => {
    setSettingsEditString(value);
    setJsonError(null);
  };

  const turnOnEditMode = () => updateSettingsEditString(buildSettingsString(settings));
  const turnOffEditMode = () => updateSettingsEditString(null);
  const onChangeSettings = newValue => updateSettingsEditString(newValue);
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    updateSettingsEditString(null);
  };

  // Convert settings string from editor into object and post to backend
  const saveSettings = async () => {
    // Check if the JSON is valid and notify if not
    try {
      JSON.parse(settingsEditString);
    } catch (error) {
      notifyError(`Invalid JSON: ${error.message}`);
      setJsonError(error);
      return;
    }
    const settingsObject = JSON.parse(settingsEditString);
    setSettings(settingsObject);
    turnOffEditMode();
    const response = await api.put('admin/settings', {
      settings: settingsObject,
      facilityId: selectedFacility !== SETTINGS_SCOPES.CENTRAL ? selectedFacility : null,
      scope,
    });

    if (response.code === 200) {
      notifySuccess('Settings saved');
    } else {
      notifyError(`Error while saving settings: ${response.message}`);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings', {
        facilityId: selectedFacility,
        scope,
      });
      setSettings(settingsObject);
    };
    fetchSettings();
  }, [api, selectedFacility, scope]);

  const editMode = !!settingsEditString;

  return (
    <AdminViewContainer title="Settings">
      <StyledTopBar>
        <ScopeSelector selectedFacility={selectedFacility} onChangeFacility={onChangeFacility} />
        <DefaultSettingsButton onClick={() => setIsDefaultModalOpen(true)}>
          <Settings />
          View default {scope} settings
        </DefaultSettingsButton>
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={turnOffEditMode}>
                Cancel
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!hasSettingsChanged}>
                Save
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={turnOnEditMode}>Edit</LargeButton>
          )}
        </ButtonRow>
      </StyledTopBar>
      <ContentPane>
        <JSONEditor
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : settingsViewString}
          editMode={editMode}
          error={jsonError}
          placeholderText="No settings found for this server/facility"
          fontSize={14}
        />
      </ContentPane>
      <DefaultSettingsModal
        open={isDefaultModalOpen}
        onClose={() => setIsDefaultModalOpen(false)}
        scope={scope}
      />
    </AdminViewContainer>
  );
});
