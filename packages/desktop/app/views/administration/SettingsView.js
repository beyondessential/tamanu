import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Colors } from '../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar, SelectInput } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { useApi } from '../../api';
import { notifySuccess } from '../../utils';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
`;

const FacilitySelector = styled(SelectInput)`
  width: 500px;
`;

const ALL_FACILITIES_OPTION = [{ label: 'All Facilities', value: null }];

const generateAnnotationFromJSONError = (errorMessage, json) => {
  const rows = json.split('\n');
  let charCount = 0;
  let row;
  let column;

  const match = errorMessage.match(/position (\d+)/);
  const position = parseInt(match[1], 10);

  for (let i = 0; i < rows.length; i++) {
    charCount += rows[i].length + 1; // Add 1 for the newline character
    if (charCount > position) {
      row = i;
      column = position - (charCount - rows[i].length);
      break;
    }
  }
  return {
    type: 'error',
    row,
    column,
    text: errorMessage,
  };
};

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settings, setSettings] = useState({});
  const [settingsEditString, setSettingsEditString] = useState({});

  const [facilityOptions, setFacilityOptions] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [editMode, setEditMode] = useState(false);

  const [errorAnnotation, setErrorAnnotation] = useState(null);

  const isValidJSON = !errorAnnotation;
  const areSettingsPresent = Object.keys(settings).length > 0;
  const formattedJSONString = areSettingsPresent ? JSON.stringify(settings, null, 2) : '';

  // Check if the JSON is valid and add an error annotation to the code editor if not
  const checkValidJson = json => {
    try {
      JSON.parse(json);
      setErrorAnnotation(null);
    } catch (error) {
      const annotation = generateAnnotationFromJSONError(error.message, json);
      setErrorAnnotation([annotation]);
      return false;
    }
    return true;
  };

  const toggleEditMode = () => setEditMode(!editMode);

  const onChangeSettings = newValue => {
    checkValidJson(newValue);
    setSettingsEditString(newValue);
  };
  const onChangeFacility = event => {
    setSelectedFacility(event.target.value || null);
    setEditMode(false);
  };

  // Convert settings string from editor into object and post to backend
  const saveSettings = () => {
    setSettings(JSON.parse(settingsEditString));
    toggleEditMode();
    api.put('admin/settings', {
      settings: JSON.parse(settingsEditString),
      facilityId: selectedFacility,
    });
    notifySuccess('Settings saved');
  };

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
          label="Select a facility to view and edit its settings"
          isClearable={false}
        />
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={toggleEditMode}>
                Cancel
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!isValidJSON}>
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
          theme={editMode ? 'eclipse' : 'dawn'}
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : formattedJSONString}
          $isJsonValid={isValidJSON}
          showPrintMargin={false}
          readOnly={!editMode}
          annotations={errorAnnotation}
          placeholder="No settings found for this facility"
          fontSize={14}
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
