import { useContext, useState } from 'react';

import { PageSizePreferencesContext } from '../../contexts/PageSizePreferences';
import { LARGE_ROWS_PER_PAGE_OPTIONS, ROWS_PER_PAGE_OPTIONS } from '../../constants';

/**
 * The page size for a table. A table given a preference key offers the large page sizes and
 * remembers the size the user picks on it; any other table offers the standard sizes and opens
 * at its default each time. `defaultRowsPerPage` applies only to a table without a key, since a
 * table with one opens at 50 until the user picks a size.
 */
// spec: TPAGE#remembered-page-size
export const usePageSizePreference = ({ preferenceKey, defaultRowsPerPage }) => {
  const pageSizePreferences = useContext(PageSizePreferencesContext);
  const [pickedRowsPerPage, setPickedRowsPerPage] = useState(null);

  if (!preferenceKey) {
    return {
      rowsPerPage: pickedRowsPerPage ?? defaultRowsPerPage ?? ROWS_PER_PAGE_OPTIONS[0],
      rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
      onChangeRowsPerPage: setPickedRowsPerPage,
      isPageSizeReady: true,
    };
  }

  if (!pageSizePreferences) {
    throw new Error(
      `The table remembering "${preferenceKey}" must be inside a page size preferences provider`,
    );
  }
  const { preferences, isLoaded, savePreference } = pageSizePreferences;
  const savedRowsPerPage = preferences?.[preferenceKey];
  const isSavedSizeOffered = LARGE_ROWS_PER_PAGE_OPTIONS.includes(savedRowsPerPage);

  return {
    rowsPerPage:
      pickedRowsPerPage ?? (isSavedSizeOffered ? savedRowsPerPage : LARGE_ROWS_PER_PAGE_OPTIONS[0]),
    rowsPerPageOptions: LARGE_ROWS_PER_PAGE_OPTIONS,
    onChangeRowsPerPage: rowsPerPage => {
      // The picked size applies straight away, whether or not saving it succeeds
      setPickedRowsPerPage(rowsPerPage);
      savePreference({ key: preferenceKey, value: rowsPerPage });
    },
    // Ready once the preferences have loaded, or failed to, so the first load is at the right size
    isPageSizeReady: isLoaded,
  };
};
