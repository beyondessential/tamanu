import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { LargeButton, TextButton, ContentPane, ButtonRow, TopBar } from '../../../components';
import { JSONEditor } from './JSONEditor';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { DefaultSettingsModal } from './DefaultSettingsModal';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation';

const StyledTopBar = styled(TopBar)`
  padding: 0;
  .MuiToolbar-root {
    align-items: flex-end;
  }
`;

const DefaultSettingsButton = styled(TextButton)`
  font-size: 14px;
  white-space: nowrap;
  margin-left: 5px;
  .MuiSvgIcon-root {
    margin-right: 5px;
  }
  margin-bottom: 12px;
`;

const buildSettingsString = settings => {
  if (Object.keys(settings).length === 0) return '';
  return JSON.stringify(settings, null, 2);
};

export const JSONEditorView = React.memo(({ settings, values, setValues, submitForm }) => {
  const { scope, facilityId } = values;
  const [settingsEditString, setSettingsEditString] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const settingsViewString = buildSettingsString(settings);
  const hasSettingsChanged = settingsViewString !== settingsEditString;

  const updateSettingsEditString = value => {
    setSettingsEditString(value);
    setJsonError(null);
  };

  const turnOnEditMode = () => updateSettingsEditString(buildSettingsString(settings) || '{}');
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
    <>
      <StyledTopBar>
        <ScopeSelectorFields onChangeFacility={turnOffEditMode} onChangeScope={turnOffEditMode} />
        <DefaultSettingsButton onClick={() => setIsDefaultModalOpen(true)}>
          <Settings />
          <TranslatedText
            stringId="admin.settings.viewDefaultScope.message"
            fallback="View default {scope} settings"
          />
        </DefaultSettingsButton>
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={turnOffEditMode}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!hasSettingsChanged}>
                <TranslatedText stringId="general.action.save" fallback="Save" />
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={turnOnEditMode} disabled={!isEditorVisible}>
              <TranslatedText stringId="general.action.edit" fallback="Edit" />
            </LargeButton>
          )}
        </ButtonRow>
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
    </>
  );
});
