import React from 'react';
import { get } from 'es-toolkit/compat';
import { styled } from '@mui/material';

import { useQuery } from '@tanstack/react-query';
import { Alert, SettingsContext, TranslatedText, useApi } from '@tamanu/ui-components';
import { PageLoading } from '@components/layout';
import { route } from '@tamanu/api-client';

const ErrorAlert = styled(Alert)(() => ({
  width: 400,
  maxWidth: '90%',
  margin: '40px auto 0',
}));

interface SettingsProviderProps {
  facilityId: string;
  children: React.ReactNode;
}

export const settingsQueryOptions = (api: ReturnType<typeof useApi>, facilityId: string) => ({
  queryKey: ['settings', facilityId],
  queryFn: () => api.get(route('settings/:facilityId', { facilityId })),
});

export const useSettings = (facilityId: string) => {
  const api = useApi();
  return useQuery({ ...settingsQueryOptions(api, facilityId), enabled: Boolean(facilityId) });
};

export const SettingsProvider = ({ facilityId, children }: SettingsProviderProps) => {
  const { isPending, isError, data: settings } = useSettings(facilityId);

  if (isPending) {
    return <PageLoading />;
  }

  if (isError) {
    return (
      <ErrorAlert severity="error">
        <TranslatedText
          stringId="patientPortal.settings.loadError"
          fallback="There was an error loading settings. Please try again or contact support if the problem persists."
        />
      </ErrorAlert>
    );
  }

  return (
    <SettingsContext.Provider
      value={{
        getSetting: (path: string) => get(settings, path),
        settings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
