import React from 'react';
import { get } from 'lodash';
import { styled } from '@mui/material';
import { Alert } from '@material-ui/lab';
import { useQuery } from '@tanstack/react-query';
import { SettingsContext, useApi } from '@tamanu/ui-components';
import { StyledCircularProgress } from '@components/StyledCircularProgress';

const ErrorAlert = styled(Alert)(() => ({
  width: 400,
  maxWidth: '90%',
  margin: '40px auto 0',
}));

interface SettingsProviderProps {
  facilityId: string;
  children: React.ReactNode;
}

export const useSettings = (facilityId: string) => {
  const api = useApi();
  return useQuery({
    queryKey: ['settings', facilityId],
    queryFn: () => api.get(`settings/${facilityId}`),
    enabled: Boolean(facilityId),
  });
};

export const SettingsProvider = ({ facilityId, children }: SettingsProviderProps) => {
  const { isPending, isError, data: settings } = useSettings(facilityId);

  if (isPending) {
    return <StyledCircularProgress />;
  }

  if (isError) {
    return (
      <ErrorAlert severity="error">
        There was an error loading settings. Please try again or contact support if the problem
        persists.
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
