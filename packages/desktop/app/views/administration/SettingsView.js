import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-chrome';

import { Colors } from '../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar, SelectInput } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { useApi } from '../../api';
import { notifySuccess, notifyError } from '../../utils';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
`;

const FacilitySelector = styled(SelectInput)`
  width: 500px;
`;

const checkValidJson = json => {
  try {
    JSON.parse(json);
  } catch (e) {
    return false;
  }
  return true;
};

const ALL_FACILITIES_OPTION = [{ label: 'All Facilities', value: null }];

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});
  const [facilityOptions, setFacilityOptions] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => setEditMode(!editMode);

  const onChangeSettings = newValue => setSettingsEditString(newValue);
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    setEditMode(false);
  };

  const saveSettings = () => {
    if (isJsonValid) {
      setSettings(JSON.parse(settingsEditString));
      toggleEditMode();
      api.put('admin/settings', {
        settings: JSON.parse(settingsEditString),
        facilityId: selectedFacility,
      });
      notifySuccess('Settings saved');
    } else {
      notifyError('Invalid JSON');
    }
  };

  const isJsonValid = checkValidJson(settingsEditString);

  useEffect(() => {
    const fetchFacilities = async () => {
      const facilitiesArray = await api.get('admin/facilities');
      setFacilityOptions(
        facilitiesArray.map(facility => ({ label: facility.name, value: facility.id })),
      );
    };
    const fetchSettings = async () => {
      const settingsObject = await api.get('admin/settings', { facilityId: selectedFacility });
      setSettings(settingsObject);
      setSettingsEditString(JSON.stringify(settingsObject, null, 2));
    };

    fetchFacilities();
    fetchSettings();
  }, [api, selectedFacility]);

  return (
    <AdminViewContainer title="Settings">
      <TopBar>
        <FacilitySelector
          value={selectedFacility}
          onChange={onChangeFacility}
          options={ALL_FACILITIES_OPTION.concat(facilityOptions)}
          helperText="Select a facility to view and edit its settings"
          isClearable={false}
        />
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={toggleEditMode}>
                Cancel
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!isJsonValid}>
                Save
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={toggleEditMode}>Edit</LargeButton>
          )}
        </ButtonRow>
      </TopBar>
      <ContentPane>
        <StyledAceEditor
          width="100%"
          height="600px"
          mode="json"
          theme={editMode ? 'github' : 'chrome'}
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : JSON.stringify(settings, null, 2)}
          $isJsonValid={isJsonValid}
          showPrintMargin={false}
          readOnly={!editMode}
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
