import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SETTINGS_SCOPES } from '@tamanu/shared/constants';

import { Colors } from '../../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar } from '../../../components';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { JSONEditor } from './JSONEditor';
import { FacilitySelector } from './FacilitySelector';
import { useApi } from '../../../api';
import { notifySuccess, notifyError } from '../../../utils';

const StyledTopBar = styled(TopBar)`
  padding: 0;
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

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});

  const [selectedFacility, setSelectedFacility] = useState(null);

  const [editMode, setEditMode] = useState(false);

  const [jsonError, setJsonError] = useState(null);

  const areSettingsPresent = Object.keys(settings).length > 0;
  const formattedJSONString = areSettingsPresent ? JSON.stringify(settings, null, 2) : '';
  const hasSettingsChanged = formattedJSONString !== settingsEditString;

  const scope = getScope(selectedFacility);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  const onChangeSettings = newValue => {
    setSettingsEditString(newValue);
    setJsonError(null);
  };
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    setEditMode(false);
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
    toggleEditMode();
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
    const fetchData = async () => {
      const settingsObject = await api.get('admin/settings', {
        facilityId: selectedFacility,
        scope,
      });
      setSettings(settingsObject);
      setSettingsEditString(JSON.stringify(settingsObject, null, 2));
    };

    fetchData();
  }, [api, selectedFacility, scope]);

  return (
    <AdminViewContainer title="Settings">
      <StyledTopBar>
        <FacilitySelector selectedFacility={selectedFacility} onChangeFacility={onChangeFacility} />
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={toggleEditMode}>
                Cancel
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!hasSettingsChanged}>
                Save
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={toggleEditMode}>Edit</LargeButton>
          )}
        </ButtonRow>
      </StyledTopBar>
      <ContentPane>
        <JSONEditor
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : formattedJSONString}
          editMode={editMode}
          error={jsonError}
          placeholderText="No settings found for this server/facility"
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
