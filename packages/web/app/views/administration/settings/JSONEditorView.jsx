import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { TextButton, ContentPane, ButtonRow, Button } from '../../../components';
import { JSONEditor } from './components/JSONEditor';
import { DefaultSettingsModal } from './components/DefaultSettingsModal';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation';
import { Colors } from '../../../constants';

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 20px;
`;

const StyledTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
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

const buildSettingsString = settings => {
  if (Object.keys(settings).length === 0) return '';
  return JSON.stringify(settings, null, 2);
};

export const JSONEditorView = React.memo(({ values, setValues, submitForm, scope, facilityId }) => {
  const [settingsEditString, setSettingsEditString] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const settingsViewString = buildSettingsString(values.settings);
  const hasSettingsChanged = settingsViewString !== settingsEditString;

  const updateSettingsEditString = value => {
    setSettingsEditString(value);
    setJsonError(null);
  };

  const turnOnEditMode = () =>
    updateSettingsEditString(buildSettingsString(values.settings) || '{}');
  const turnOffEditMode = () => updateSettingsEditString(null);

  const onChangeSettings = newValue => updateSettingsEditString(newValue);

  // Convert settings string from editor into object and post to backend
  const saveSettings = async event => {
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

  const editMode = !!settingsEditString;
  const isEditorVisible = scope !== SETTINGS_SCOPES.FACILITY || facilityId;

  return (
    <SettingsWrapper>
      <StyledTopBar>
        <DefaultSettingsButton onClick={() => setIsDefaultModalOpen(true)}>
          <Settings />
          <TranslatedText
            stringId="admin.settings.viewDefaultScope.message"
            fallback="View default {scope} settings"
          />
        </DefaultSettingsButton>
        <StyledButtonRow>
          {editMode ? (
            <>
              <Button variant="outlined" onClick={turnOffEditMode}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </Button>
              <Button onClick={saveSettings} disabled={!hasSettingsChanged}>
                <TranslatedText stringId="general.action.save" fallback="Save" />
              </Button>
            </>
          ) : (
            <Button onClick={turnOnEditMode} disabled={!isEditorVisible}>
              <TranslatedText stringId="general.action.edit" fallback="Edit" />
            </Button>
          )}
        </StyledButtonRow>
      </StyledTopBar>
      <ContentPane>
        {isEditorVisible && (
          <JSONEditor
            onChange={onChangeSettings}
            value={editMode ? settingsEditString : settingsViewString}
            editMode={editMode}
            error={jsonError}
            placeholder="No settings found for this server/facility"
            fontSize={14}
          />
        )}
      </ContentPane>
      <DefaultSettingsModal
        open={isDefaultModalOpen}
        onClose={() => setIsDefaultModalOpen(false)}
        scope={scope}
      />
    </SettingsWrapper>
  );
});
