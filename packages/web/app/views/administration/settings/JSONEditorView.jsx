import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { TextButton, ButtonRow, Button, JSONEditor } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { DefaultSettingsModal } from './components/DefaultSettingsModal';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation';
import { isNull } from 'lodash';

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EditorWrapper = styled.div`
  margin: 1.25rem;
  margin-top: 0;
  flex: 1;
`;

const StyledTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.25rem;
`;

const StyledButtonRow = styled(ButtonRow)`
  margin: 0;
  width: initial;
`;

const DefaultSettingsButton = styled(TextButton)`
  white-space: nowrap;
  .MuiSvgIcon-root {
    margin-right: 5px;
  }
`;

const buildSettingsString = (settings) => {
  if (Object.keys(settings).length === 0) return '';
  return JSON.stringify(settings, null, 2);
};

export const JSONEditorView = React.memo(({ values, setValues, submitForm, scope, facilityId }) => {
  const [settingsEditString, setSettingsEditString] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const settingsViewString = buildSettingsString(values.settings);
  const hasSettingsChanged = settingsViewString !== settingsEditString;

  const updateSettingsEditString = (value) => {
    setSettingsEditString(value);
    setJsonError(null);
  };

  const turnOnEditMode = () =>
    updateSettingsEditString(buildSettingsString(values.settings) || '{}');
  const turnOffEditMode = () => updateSettingsEditString(null);

  const onChangeSettings = (newValue) => updateSettingsEditString(newValue);

  // Convert settings string from editor into object and post to backend
  const saveSettings = async (event) => {
    // Check if the JSON is valid and notify if not
    try {
      JSON.parse(settingsEditString);
    } catch (error) {
      notifyError(`Invalid JSON: ${error}`);
      setJsonError(error);
      return;
    }

    // Pass the parsed settings object to the form submit function
    const settingsObject = JSON.parse(settingsEditString);
    setValues({ ...values, settings: settingsObject });

    const submitted = await submitForm(event);
    if (submitted) {
      turnOffEditMode();
    }
  };

  const editMode = !isNull(settingsEditString);
  const isEditorVisible = scope !== SETTINGS_SCOPES.FACILITY || facilityId;

  if (!isEditorVisible) {
    return null;
  }
  return (
    <SettingsWrapper data-testid="settingswrapper-9xrm">
      <StyledTopBar data-testid="styledtopbar-0gcj">
        <DefaultSettingsButton
          onClick={() => setIsDefaultModalOpen(true)}
          data-testid="defaultsettingsbutton-kn1k"
        >
          <Settings data-testid="settings-3n10" />
          <TranslatedText
            stringId="admin.settings.viewDefaultScope.message"
            fallback="View default :scope settings"
            replacements={{ scope }}
            data-testid="translatedtext-dstj"
          />
        </DefaultSettingsButton>
        <StyledButtonRow data-testid="styledbuttonrow-rzye">
          {editMode ? (
            <>
              <Button variant="outlined" onClick={turnOffEditMode} data-testid="button-uan3">
                <TranslatedText
                  stringId="general.action.cancel"
                  fallback="Cancel"
                  data-testid="translatedtext-jjde"
                />
              </Button>
              <Button
                onClick={saveSettings}
                disabled={!hasSettingsChanged}
                data-testid="button-n3bf"
              >
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid="translatedtext-lajm"
                />
              </Button>
            </>
          ) : (
            <Button onClick={turnOnEditMode} disabled={!isEditorVisible} data-testid="button-308n">
              <TranslatedText
                stringId="general.action.edit"
                fallback="Edit"
                data-testid="translatedtext-6xu9"
              />
            </Button>
          )}
        </StyledButtonRow>
      </StyledTopBar>
      <EditorWrapper data-testid="editorwrapper-80yu">
        <JSONEditor
          onChange={onChangeSettings}
          value={editMode ? settingsEditString : settingsViewString}
          editMode={editMode}
          error={jsonError}
          placeholder="No settings found for this server/facility"
          fontSize={14}
          data-testid="jsoneditor-y86r"
        />
      </EditorWrapper>
      <DefaultSettingsModal
        open={isDefaultModalOpen}
        onClose={() => setIsDefaultModalOpen(false)}
        scope={scope}
        data-testid="defaultsettingsmodal-3lpj"
      />
    </SettingsWrapper>
  );
});
