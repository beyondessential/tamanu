import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SETTINGS_SCOPES } from '@tamanu/shared/constants';

import { Colors } from '../../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar, SelectInput } from '../../../components';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { JSONEditor } from './JSONEditor';
import { useApi } from '../../../api';
import { notifySuccess, notifyError } from '../../../utils';

const StyledTopBar = styled(TopBar)`
  padding: 0;
`;

const FacilitySelector = styled(SelectInput)`
  width: 500px;
  .css-g1d714-ValueContainer {
    overflow: visible;
  }
`;

const SCOPE_HELPERTEXT = {
  CENTRAL: 'These settings stay on the central server and wont apply to any facilities',
  GLOBAL: 'These settings will apply to all facilities/devices',
  FACILITY: `These settings will only apply to this facility/devices linked to it`,
};

const BASIC_OPTIONS = [
  {
    label: 'Central Server',
    value: SETTINGS_SCOPES.CENTRAL,
    tag: {
      label: 'Central',
      background: Colors.pink,
      color: Colors.white,
    },
  },
  {
    label: 'All Facilities',
    value: null, // null is equivalent to all faciliites in backend logic
    tag: {
      label: 'Global',
      background: Colors.orange,
      color: Colors.white,
    },
  },
];

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

const getHelperText = selectedFacility => {
  switch (selectedFacility) {
    case SETTINGS_SCOPES.CENTRAL:
      return SCOPE_HELPERTEXT.CENTRAL;
    case null:
      return SCOPE_HELPERTEXT.GLOBAL;
    default:
      return SCOPE_HELPERTEXT.FACILITY;
  }
};

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});

  const [facilityOptions, setFacilityOptions] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const [jsonError, setJsonError] = useState(null);

  const areSettingsPresent = Object.keys(settings).length > 0;
  const formattedJSONString = areSettingsPresent ? JSON.stringify(settings, null, 2) : '';
  const hasSettingsChanged = formattedJSONString !== settingsEditString;

  const scope = getScope(selectedFacility);
  const helperText = getHelperText(selectedFacility);

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setShowValidation(false);
  };
  const onChangeSettings = newValue => {
    setSettingsEditString(newValue);
    setShowValidation(false);
  };
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    setEditMode(false);
  };

  // Convert settings string from editor into object and post to backend
  const saveSettings = async () => {
    // Check if the JSON is valid and notify if not
    try {
      setShowValidation(false);
      JSON.parse(settingsEditString);
    } catch (error) {
      notifyError(`Invalid JSON: ${error.message}`);
      setShowValidation(true);
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
      const facilitiesArray = await api.get('admin/facilities');
      setFacilityOptions(
        facilitiesArray.map(facility => ({
          label: facility.name,
          value: facility.id,
          tag: {
            label: 'Facility',
            background: Colors.blue,
            color: Colors.white,
          },
        })),
      );
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
        <FacilitySelector
          value={selectedFacility}
          onChange={onChangeFacility}
          options={BASIC_OPTIONS.concat(facilityOptions)}
          label="Select a facility/server to view and edit its settings"
          isClearable={false}
          helperText={helperText}
        />
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
          showValidation={showValidation}
          value={editMode ? settingsEditString : formattedJSONString}
          editMode={editMode}
          error={jsonError}
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
