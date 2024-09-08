import React, { useState } from 'react';
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
    key: 'editor',
    icon: 'fa fa-cog',
    render: props => (
      <TabContainer $backgroundColor={Colors.background}>
        <EditorView {...props} />
      </TabContainer>
    ),
  },
  {
    label: <TranslatedText stringId="admin.settings.tab.json.title" fallback="JSON editor" />,
    key: 'json',
    icon: 'fa fa-code',
    render: props => (
      <TabContainer>
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

  console.log(scope);

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
        // initialValues={{ scope: SETTINGS_SCOPES.GLOBAL, facilityId: null }}
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
  submitForm,
  resetForm,
  dirty,
  scope,
  setScope,
  facilityId,
  setFacilityId,
}) => {
  console.log(scope);
  const [currentTab, setCurrentTab] = useState('editor');
  // const [scope, setCurrentScope] = useState(SETTINGS_SCOPES.GLOBAL)
  // const [facilityId, setFacilityId] = useState(null)
  const api = useApi();
  const { ability } = useAuth();
  // TODO: maybe move these into state so they dont get reset with other form values
  // const { scope, facilityId } = values;
  const canViewJSONEditor = ability.can('write', 'Setting');

  const { data: settingsSnapshot = {}, error: settingsFetchError } = useQuery(
    ['scopedSettings', scope, facilityId],
    () => api.get('admin/settings', { scope, facilityId }),
  );

  if (settingsFetchError) {
    return <ErrorMessage title="Settings fetch error" errorMessage={settingsFetchError.message} />;
  }

  return canViewJSONEditor ? (
    <StyledTabDisplay
      tabs={tabs}
      currentTab={currentTab}
      onTabSelect={setCurrentTab}
      scrollable={false}
      settingsSnapshot={settingsSnapshot}
      setValues={setValues}
      values={values}
      submitForm={submitForm}
      resetForm={resetForm}
      dirty={dirty}
      scope={scope}
      setScope={setScope}
      facilityId={facilityId}
      setFacilityId={setFacilityId}
    />
  ) : (
    <EditorView settingsSnapshot={settingsSnapshot} values={values} />
  );
};
