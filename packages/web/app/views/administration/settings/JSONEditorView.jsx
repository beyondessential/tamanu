import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { validateSettings } from '@tamanu/settings/schema';

import { LargeButton, TextButton, ContentPane, ButtonRow, TopBar } from '../../../components';
import { JSONEditor } from './JSONEditor';
import { ScopeSelector } from './ScopeSelector';
import { DefaultSettingsModal } from './DefaultSettingsModal';
import { useApi } from '../../../api';
import { notifySuccess, notifyError } from '../../../utils';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { TranslatedText } from '../../../components/Translation';
import { ValidationError } from 'yup';

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

export const JSONEditorView = React.memo(() => {
  const api = useApi();
  const [settingsEditString, setSettingsEditString] = useState('');
  const [scope, setScope] = useState(SETTINGS_SCOPES.GLOBAL);
  const [facilityId, setFacilityId] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const { data: settings = {}, refetch: refetchSettings, error: settingsFetchError } = useQuery(
    ['scopedSettings', scope, facilityId],
    () => api.get('admin/settings', { scope, facilityId }),
  );

  const settingsViewString = buildSettingsString(settings);
  const hasSettingsChanged = settingsViewString !== settingsEditString;

  const updateSettingsEditString = value => {
    setSettingsEditString(value);
    setJsonError(null);
  };

  const turnOnEditMode = () => updateSettingsEditString(buildSettingsString(settings) || '{}');
  const turnOffEditMode = () => updateSettingsEditString(null);
  const onChangeSettings = newValue => updateSettingsEditString(newValue);
  const onChangeScope = event => {
    setScope(event.target.value || null);
    setFacilityId(null);
    updateSettingsEditString(null);
  };
  const onChangeFacility = event => {
    setFacilityId(event.target.value || null);
    updateSettingsEditString(null);
  };

  // Convert settings string from editor into object and post to backend
  const saveSettings = async () => {
    // Check if the JSON is valid and notify if not
    try {
      JSON.parse(settingsEditString);
    } catch (error) {
      notifyError(`Invalid JSON: ${error}`);
      setJsonError(error);
      return;
    }

    const settingsObject = JSON.parse(settingsEditString);

    try {
      await validateSettings({ settings: settingsObject, scope });
      await api.put('admin/settings', {
        settings: settingsObject,
        facilityId,
        scope,
      });
      notifySuccess('Settings saved');
      await refetchSettings();
      turnOffEditMode();
    } catch (error) {
      if (error instanceof ValidationError) {
        error?.inner?.forEach(e => {
          notifyError(e.message);
        });
      } else {
        notifyError(`Error while saving settings: ${error.message}`);
      }
    }
  };

  const editMode = !!settingsEditString;
  const isEditorVisible = scope !== SETTINGS_SCOPES.FACILITY || facilityId;

  return (
    <>
      <StyledTopBar>
        <ScopeSelector
          selectedScope={scope}
          onChangeScope={onChangeScope}
          selectedFacility={facilityId}
          onChangeFacility={onChangeFacility}
        />
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
        {settingsFetchError && (
          <ErrorMessage title="Settings fetch error" errorMessage={settingsFetchError.message} />
        )}
        {isEditorVisible && (
          <JSONEditor
            onChange={onChangeSettings}
            value={editMode ? settingsEditString : settingsViewString}
            editMode={editMode}
            error={jsonError}
            placeholderText="No settings found for this server/facility"
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
