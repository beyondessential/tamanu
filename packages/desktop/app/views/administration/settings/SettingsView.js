import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings } from '@material-ui/icons';
import { useQuery } from '@tanstack/react-query';

import { SETTINGS_SCOPES } from '@tamanu/constants';

import { LargeButton, TextButton, ContentPane, ButtonRow, TopBar } from '../../../components';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { JSONEditor } from './JSONEditor';
import { ScopeSelector } from './ScopeSelector';
import { DefaultSettingsModal } from './DefaultSettingsModal';
import { useApi } from '../../../api';
import { notifySuccess, notifyError } from '../../../utils';
import { ErrorMessage } from '../../../components/ErrorMessage';

const StyledTopBar = styled(TopBar)`
  padding: 0;
`;

const DefaultSettingsButton = styled(TextButton)`
  font-size: 14px;
  white-space: nowrap;
  margin-left: 10px;
  .MuiSvgIcon-root {
    margin-right: 5px;
  }
`;

const buildSettingsString = settings => {
  if (Object.keys(settings).length === 0) return '';
  return JSON.stringify(settings, null, 2);
};

const parseScopeCode = scopeCode => {
  const scope = scopeCode?.split('#')[0];
  const facilityId = scopeCode?.split('#')[1] || null;
  return { scope, facilityId };
};

export const SettingsView = React.memo(() => {
  const api = useApi();
  const [settingsEditString, setSettingsEditString] = useState('');
  const [selectedScope, setSelectedScope] = useState(SETTINGS_SCOPES.GLOBAL);
  const [jsonError, setJsonError] = useState(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);

  const { scope, facilityId } = parseScopeCode(selectedScope);

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
    setSelectedScope(event.target.value || null);
    updateSettingsEditString(null);
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
    const response = await api.put('admin/settings', {
      settings: settingsObject,
      facilityId: scope === SETTINGS_SCOPES.FACILITY ? facilityId : null,
      scope,
    });

    await refetchSettings();
    turnOffEditMode();

    if (response.code === 200) {
      notifySuccess('Settings saved');
    } else {
      notifyError(`Error while saving settings: ${response.message}`);
    }
  };

  const editMode = !!settingsEditString;

  return (
    <AdminViewContainer title="Settings">
      <StyledTopBar>
        <ScopeSelector selectedScope={selectedScope} onChangeScope={onChangeScope} />
        <DefaultSettingsButton onClick={() => setIsDefaultModalOpen(true)}>
          <Settings />
          View default {scope} settings
        </DefaultSettingsButton>
        <ButtonRow>
          {editMode ? (
            <>
              <LargeButton variant="outlined" onClick={turnOffEditMode}>
                Cancel
              </LargeButton>
              <LargeButton onClick={saveSettings} disabled={!hasSettingsChanged}>
                Save
              </LargeButton>
            </>
          ) : (
            <LargeButton onClick={turnOnEditMode}>Edit</LargeButton>
          )}
        </ButtonRow>
      </StyledTopBar>
      <ContentPane>
        {settingsFetchError ? (
          <ErrorMessage title="Settings fetch error" errorMessage={settingsFetchError.message} />
        ) : (
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
    </AdminViewContainer>
  );
});
