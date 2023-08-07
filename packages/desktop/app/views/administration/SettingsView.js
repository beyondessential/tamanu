import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { SETTINGS_SCOPES } from '@tamanu/shared/constants';

import { Colors } from '../../constants';
import { LargeButton, ContentPane, ButtonRow, TopBar, SelectInput } from '../../components';
import { AdminViewContainer } from './components/AdminViewContainer';
import { useApi } from '../../api';
import { notifySuccess, notifyError } from '../../utils';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
`;

const StyledTopBar = styled(TopBar)`
  padding: 0;
`;

const FacilitySelector = styled(SelectInput)`
  width: 500px;
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
    setErrorAnnotation(null);
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

  const onLoad = editor => {
    // Disable the "undo" command (Ctrl+Z)
    editor.commands.addCommand({
      name: 'undo',
      bindKey: { win: 'Ctrl-Z', mac: 'Command-Z' },
      exec: () => {},
    });
  };

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
              <LargeButton onClick={saveSettings} disabled={!isValidJSON}>
                Save
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={toggleEditMode}>Edit</LargeButton>
          )}
        </ButtonRow>
      </StyledTopBar>
      <ContentPane>
        <StyledAceEditor
          width="100%"
          height="600px"
          mode="json"
          showPrintMargin={false}
          placeholder="No settings found for this facility/server"
          fontSize={14}
          theme={editMode ? 'eclipse' : 'dawn'}
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : formattedJSONString}
          highlightActiveLine={editMode}
          $isJsonValid={isValidJSON}
          readOnly={!editMode}
          annotations={errorAnnotation}
          onLoad={onLoad}
        />
      </ContentPane>
    </AdminViewContainer>
  );
});
