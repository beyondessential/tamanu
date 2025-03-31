import React, { useMemo, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { ValidationError } from 'yup';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { applyDefaults, validateSettings } from '@tamanu/settings';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { Form, TranslatedText } from '../../../components';
import { JSONEditorView } from './JSONEditorView';
import { useAuth } from '../../../contexts/Auth';
import { useApi } from '../../../api';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { notifyError, notifySuccess } from '../../../utils';
import { Colors } from '../../../constants';
import { EditorView } from './EditorView';
import { ScopeSelectorFields } from './components/ScopeSelectorFields';
import { WarningModal } from './components/WarningModal';

const SETTING_TABS = {
  EDITOR: 'editor',
  JSON: 'JSON',
};

const StyledTabDisplay = styled(TabDisplay)`
  height: 100%;
  border-top: 1px solid ${Colors.outline};
  > div:last-child {
    flex: 1;
  }
`;

const TabContainer = styled.div`
  height: 100%;
  padding: 1.25rem;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  background-color: ${Colors.background};
`;

const tabs = [
  {
    label: <TranslatedText
      stringId="admin.settings.tab.editor.title"
      fallback="Editor"
      data-test-id='translatedtext-1ap8' />,
    key: SETTING_TABS.EDITOR,
    icon: 'fa fa-cog',
    render: props => {
      // Don't show the editor if the scope is facility and no facility is selected
      const { facilityId, scope } = props.values;
      const shouldShowEditor = scope !== SETTINGS_SCOPES.FACILITY || !!facilityId;
      return (
        <TabContainer data-test-id='tabcontainer-opna'>
          <ScopeSelectorFields {...props} />
          {shouldShowEditor && <EditorView {...props} />}
        </TabContainer>
      );
    },
  },
  {
    label: <TranslatedText
      stringId="admin.settings.tab.jsonEditor.title"
      fallback="JSON editor"
      data-test-id='translatedtext-tv1l' />,
    key: SETTING_TABS.JSON,
    icon: 'fa fa-code',
    render: props => (
      <TabContainer data-test-id='tabcontainer-ggyi'>
        <ScopeSelectorFields {...props} />
        <JSONEditorView {...props} />
      </TabContainer>
    ),
  },
];

export const SettingsView = () => {
  const api = useApi();
  const [scope, setScope] = useState(SETTINGS_SCOPES.GLOBAL);
  const [facilityId, setFacilityId] = useState(null);

  const { data: settingsSnapshot = {}, error: settingsFetchError } = useQuery(
    ['scopedSettings', scope, facilityId],
    async () => {
      const data = await api.get('admin/settings', { scope, facilityId });
      return applyDefaults(data, scope);
    },
    {
      enabled: scope !== SETTINGS_SCOPES.FACILITY || !!facilityId,
    },
  );

  const queryClient = useQueryClient();

  const handleSubmit = async ({ settings }) => {
    try {
      await validateSettings({ settings, scope });
      await api.put('admin/settings', { settings, facilityId, scope });
      notifySuccess('Settings saved');
      queryClient.invalidateQueries(['scopedSettings', scope, facilityId]);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        error?.inner?.forEach(e => {
          notifyError(e.message);
        });
      } else {
        notifyError(`Error while saving settings: ${error.message}`);
      }
      return false;
    }
  };

  return (
    <AdminViewContainer
      title={<TranslatedText
        stringId="admin.settings.title"
        fallback="Settings"
        data-test-id='translatedtext-pa0x' />}
    >
      {settingsFetchError ? (
        <ErrorMessage error={settingsFetchError} />
      ) : (
        <Form
          enableReinitialize
          initialValues={{ scope, facilityId, settings: settingsSnapshot }}
          onSubmit={handleSubmit}
          render={props => (
            <SettingsForm
              {...props}
              scope={scope}
              setScope={setScope}
              facilityId={facilityId}
              setFacilityId={setFacilityId}
            />
          )}
          style={{ flex: 1 }}
        />
      )}
    </AdminViewContainer>
  );
};

const SettingsForm = ({
  values,
  setValues,
  setFieldValue,
  submitForm,
  resetForm,
  isSubmitting,
  dirty,
  scope,
  setScope,
  facilityId,
  setFacilityId,
}) => {
  const { ability } = useAuth();
  const [currentTab, setCurrentTab] = useState(SETTING_TABS.EDITOR);
  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const canViewJSONEditor = ability.can('write', 'Setting');
  const filteredTabs = useMemo(
    () => (canViewJSONEditor ? tabs : tabs.filter(({ key }) => key !== SETTING_TABS.JSON)),
    [canViewJSONEditor],
  );

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const handleChangeTab = async newTab => {
    if (newTab !== currentTab && dirty) {
      const dismissChanges = await handleShowWarningModal();
      if (!dismissChanges) return;
      await resetForm();
    }
    setCurrentTab(newTab);
  };

  const handleChangeScope = async e => {
    const newScope = e.target.value;
    if (newScope !== scope && dirty) {
      const dismissChanges = await handleShowWarningModal();
      if (!dismissChanges) return;
    }
    setScope(newScope);
    setFacilityId(null);
  };

  const handleFacilityChange = async e => {
    const newFacilityId = e.target.value;
    if (newFacilityId !== facilityId && dirty) {
      const dismissChanges = await handleShowWarningModal();
      if (!dismissChanges) return;
    }
    setFacilityId(newFacilityId);
  };

  return (
    <>
      <StyledTabDisplay
        tabs={filteredTabs}
        currentTab={currentTab}
        onTabSelect={handleChangeTab}
        scrollable={false}
        setValues={setValues}
        setFieldValue={setFieldValue}
        handleShowWarningModal={handleShowWarningModal}
        values={values}
        submitForm={submitForm}
        isSubmitting={isSubmitting}
        resetForm={resetForm}
        dirty={dirty}
        scope={scope}
        onScopeChange={handleChangeScope}
        facilityId={facilityId}
        onFacilityChange={handleFacilityChange}
        data-test-id='styledtabdisplay-pbea' />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </>
  );
};
