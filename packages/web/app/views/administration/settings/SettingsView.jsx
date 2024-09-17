import React, { useMemo, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { ValidationError } from 'yup';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { validateSettings } from '@tamanu/settings';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { JSONEditorView } from './JSONEditorView';
import { useAuth } from '../../../contexts/Auth';
import { Form } from '../../../components';
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

const StyledAdminViewContainer = styled(AdminViewContainer)`
  display: flex;
  flex-direction: column;
  height: 100%;
  > div {
    display: flex;
    flex-direction: column;
  }
`;

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  height: 100%;
  border-top: 1px solid ${Colors.outline};
  > div:last-child {
    flex: 1;
  }
`;

const TabContainer = styled.div`
  height: 100%;
  padding: 20px;
  background-color: ${props => props.$backgroundColor || Colors.white};
`;

const tabs = [
  {
    label: <TranslatedText stringId="admin.settings.tab.editor.title" fallback="Editor" />,
    key: SETTING_TABS.EDITOR,
    icon: 'fa fa-cog',
    render: props => (
      <TabContainer $backgroundColor={Colors.background}>
        <ScopeSelectorFields {...props} />
        <EditorView {...props} />
      </TabContainer>
    ),
  },
  {
    label: <TranslatedText stringId="admin.settings.tab.json.title" fallback="JSON editor" />,
    key: SETTING_TABS.JSON,
    icon: 'fa fa-code',
    render: props => (
      <TabContainer $backgroundColor={Colors.background}>
        <ScopeSelectorFields {...props} />
        <JSONEditorView {...props} />
      </TabContainer>
    ),
  },
];

export const SettingsView = () => {
  const queryClient = useQueryClient();
  const api = useApi();

  const [scope, setScope] = useState(SETTINGS_SCOPES.GLOBAL);
  const [facilityId, setFacilityId] = useState(null);

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
    <StyledAdminViewContainer
      title={<TranslatedText stringId="admin.settings.title" fallback="Settings" />}
    >
      <Form
        onSubmit={handleSubmit}
        render={formProps => (
          <SettingsForm
            {...formProps}
            scope={scope}
            setScope={setScope}
            facilityId={facilityId}
            setFacilityId={setFacilityId}
          />
        )}
        style={{ flex: 1 }}
      />
    </StyledAdminViewContainer>
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
  const api = useApi();
  const { ability } = useAuth();
  const [currentTab, setCurrentTab] = useState(SETTING_TABS.EDITOR);
  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

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
      await resetForm();
    }
    setScope(newScope);
  };

  const handleResetForm = async () => {
    await resetForm({
      values,
    });
  };

  const handleChangeFacilityId = e => {
    setFacilityId(e.target.value);
  };

  const { data: settingsSnapshot = {}, error: settingsFetchError } = useQuery(
    ['scopedSettings', scope, facilityId],
    () => api.get('admin/settings', { scope, facilityId }),
    {},
  );

  const canViewJSONEditor = ability.can('write', 'Setting');
  const filteredTabs = useMemo(
    () => (canViewJSONEditor ? tabs : tabs.filter(({ key }) => key !== SETTING_TABS.JSON)),
    [canViewJSONEditor],
  );

  if (settingsFetchError) {
    return <ErrorMessage title="Settings fetch error" errorMessage={settingsFetchError.message} />;
  }

  return (
    <>
      <StyledTabDisplay
        tabs={filteredTabs}
        currentTab={currentTab}
        onTabSelect={handleChangeTab}
        scrollable={false}
        settingsSnapshot={settingsSnapshot}
        setValues={setValues}
        setFieldValue={setFieldValue}
        values={values}
        submitForm={submitForm}
        isSubmitting={isSubmitting}
        resetForm={handleResetForm}
        dirty={dirty}
        handleChangeScope={handleChangeScope}
        handleChangeFacilityId={handleChangeFacilityId}
        scope={scope}
        facilityId={facilityId}
        handleShowWarningModal={handleShowWarningModal}
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </>
  );
};
