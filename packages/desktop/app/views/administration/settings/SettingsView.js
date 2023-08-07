import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SETTINGS_SCOPES } from '@tamanu/shared/constants';

import { Colors } from '../../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar, SelectInput } from '../../../components';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { JSONEditor } from './SettingsJSONEditor';
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

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});

  const [facilityOptions, setFacilityOptions] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [editMode, setEditMode] = useState(false);

  const areSettingsPresent = Object.keys(settings).length > 0;
  const formattedJSONString = areSettingsPresent ? JSON.stringify(settings, null, 2) : '';

  let scope;
  let helperText;
  if (selectedFacility === SETTINGS_SCOPES.CENTRAL) {
    scope = SETTINGS_SCOPES.CENTRAL;
    helperText = 'These settings stay on the central server and wont apply to any facilities';
  } else if (selectedFacility) {
    scope = SETTINGS_SCOPES.FACILITY;
    helperText = `These settings will only apply to this facility`;
  } else {
    scope = SETTINGS_SCOPES.GLOBAL;
    helperText = 'These settings will apply to all facilities/devices';
  }

  const toggleEditMode = () => setEditMode(!editMode);

  const onChangeSettings = newValue => {
    setSettingsEditString(newValue);
  };
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    setEditMode(false);
  };

  // Convert settings string from editor into object and post to backend
  const saveSettings = async () => {
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
    const fetchFacilities = async () => {
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
    };
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings', {
        facilityId: selectedFacility,
        scope,
      });
      setSettings(settingsObject);
      setSettingsEditString(JSON.stringify(settingsObject, null, 2));
    };

    fetchFacilities();
    fetchSettings();
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
              <LargeButton onClick={saveSettings}>Save</LargeButton>
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
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
