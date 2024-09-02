import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { ValidationError } from 'yup';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { validateSettings } from '@tamanu/settings';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { Form, TranslatedText } from '../../../components';
import { JSONEditorView } from './JSONEditorView';
import { useAuth } from '../../../contexts/Auth';
import { useApi } from '../../../api';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { notifyError, notifySuccess } from '../../../utils';
import { Colors } from '../../../constants';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  border-top: 1px solid ${Colors.outline};
`;

const TabContainer = styled.div`
  padding: 20px;
`;

const tabs = [
  {
    label: <TranslatedText stringId="admin.settings.tab.editor.title" fallback="Editor" />,
    key: 'editor',
    icon: 'fa fa-cog',
    render: () => (
      <TabContainer>
        <p>GUI starts here</p>
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
  const handleSubmit = async ({ settings, scope, facilityId }) => {
    try {
      await validateSettings({ settings, scope });
      await api.put('admin/settings', {
        settings,
        facilityId,
        scope,
      });
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
      title={<TranslatedText stringId="admin.settings.title" fallback="Settings" />}
    >
      <Form
        initialValues={{ scope: SETTINGS_SCOPES.GLOBAL, facilityId: null }}
        onSubmit={handleSubmit}
        render={SettingsForm}
      />
    </AdminViewContainer>
  );
};

const SettingsForm = ({ values, setValues, setFieldValue, submitForm, status }) => {
  const [currentTab, setCurrentTab] = useState('editor');
  const api = useApi();
  const { ability } = useAuth();
  const { scope, facilityId } = values;
  const canViewJSONEditor = ability.can('write', 'Setting');

  const { data: settings = {}, error: settingsFetchError } = useQuery(
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
      settings={settings}
      setFieldValue={setFieldValue}
      setValues={setValues}
      values={values}
      submitForm={submitForm}
      status={status}
    />
  ) : (
    <p>GUI starts here</p>
  );
};
