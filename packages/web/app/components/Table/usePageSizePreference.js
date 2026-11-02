import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SERVER_TYPES } from '@tamanu/constants';

import { useApi } from '../../api';
import { useAdminUserPreferencesQuery, useUserPreferencesQuery } from '../../api/queries';
import { getCurrentUser, getServerType } from '../../store/auth';
import { LARGE_ROWS_PER_PAGE_OPTIONS, ROWS_PER_PAGE_OPTIONS } from '../../constants';

/**
 * The page size for a table. A table given a preference key offers the large page sizes and
 * remembers the size the user picks on it; any other table offers the standard sizes and opens
 * at its default each time.
 */
// spec: TPAGE#remembered-page-size
export const usePageSizePreference = ({ preferenceKey, defaultRowsPerPage }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const currentUser = useSelector(getCurrentUser);
  const isCentralServer = useSelector(getServerType) === SERVER_TYPES.CENTRAL;
  const isRemembered = Boolean(preferenceKey);

  // The admin panel keeps its preferences on the central server, the clinical app on the facility
  // server. The preferences are saved with no facility so they follow the user everywhere.
  const facilityPreferencesQuery = useUserPreferencesQuery({
    enabled: isRemembered && !isCentralServer,
  });
  const adminPreferencesQuery = useAdminUserPreferencesQuery({
    enabled: isRemembered && isCentralServer,
  });
  const preferencesQuery = isCentralServer ? adminPreferencesQuery : facilityPreferencesQuery;
  const preferencesQueryKey = isCentralServer
    ? ['adminUserPreferences', currentUser?.id]
    : ['userPreferences', currentUser?.id];

  const { mutate: savePageSize } = useMutation({
    mutationFn: rowsPerPage =>
      api.post(isCentralServer ? 'admin/user/userPreferences' : 'user/userPreferences', {
        key: preferenceKey,
        value: rowsPerPage,
      }),
    // Write the saved size into the cached preferences instead of refetching them all
    onSuccess: (_, rowsPerPage) =>
      queryClient.setQueryData(preferencesQueryKey, preferences => ({
        ...preferences,
        [preferenceKey]: rowsPerPage,
      })),
  });

  const [pickedRowsPerPage, setPickedRowsPerPage] = useState(null);

  if (!isRemembered) {
    return {
      rowsPerPage: pickedRowsPerPage ?? defaultRowsPerPage ?? ROWS_PER_PAGE_OPTIONS[0],
      rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
      onChangeRowsPerPage: setPickedRowsPerPage,
      isPageSizeReady: true,
    };
  }

  const savedRowsPerPage = preferencesQuery.data?.[preferenceKey];
  const isSavedSizeOffered = LARGE_ROWS_PER_PAGE_OPTIONS.includes(savedRowsPerPage);

  return {
    rowsPerPage:
      pickedRowsPerPage ?? (isSavedSizeOffered ? savedRowsPerPage : LARGE_ROWS_PER_PAGE_OPTIONS[0]),
    rowsPerPageOptions: LARGE_ROWS_PER_PAGE_OPTIONS,
    onChangeRowsPerPage: rowsPerPage => {
      // The picked size applies straight away, whether or not saving it succeeds
      setPickedRowsPerPage(rowsPerPage);
      savePageSize(rowsPerPage);
    },
    // Ready once the preferences have loaded, or failed to, so the first fetch is at the right size
    isPageSizeReady: !preferencesQuery.isLoading,
  };
};
