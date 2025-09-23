import React from 'react';
import { get } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { SettingsContext, useApi } from '@tamanu/ui-components';
import { StyledCircularProgress } from '@components/StyledCircularProgress';

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
  const { isPending, data: settings } = useSettings(facilityId);

  if (isPending) {
    return <StyledCircularProgress />;
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
