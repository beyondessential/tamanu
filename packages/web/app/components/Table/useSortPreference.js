import { useContext, useMemo, useState } from 'react';
import { TABLE_PAGE_SIZE_PREFERENCE_KEYS, TABLE_SORT_PREFERENCE_KEYS } from '@tamanu/constants';

import { PageSizePreferencesContext } from '../../contexts/PageSizePreferences';

const getSortPreferenceKey = pageSizePreferenceKey => {
  const tableName = Object.keys(TABLE_PAGE_SIZE_PREFERENCE_KEYS).find(
    name => TABLE_PAGE_SIZE_PREFERENCE_KEYS[name] === pageSizePreferenceKey,
  );
  return TABLE_SORT_PREFERENCE_KEYS[tableName];
};

/**
 * The sort for a table. A table whose page size key has a sort key of the same name remembers the
 * sort the user applies on it, per user and facility; any other table opens at its initial sort
 * each time.
 */
// spec: TPAGE#remembered-sort
export const useSortPreference = ({ pageSizePreferenceKey, columns, initialSort }) => {
  const pageSizePreferences = useContext(PageSizePreferencesContext);
  const preferenceKey = getSortPreferenceKey(pageSizePreferenceKey);
  const [pickedSorting, setPickedSorting] = useState(preferenceKey ? null : initialSort);

  const savedSorting = preferenceKey ? pageSizePreferences.preferences[preferenceKey] : undefined;
  const isSavedColumnSortable =
    Boolean(savedSorting) &&
    columns.some(({ key, sortable = true }) => sortable && key === savedSorting.orderBy);
  const { order, orderBy } = isSavedColumnSortable ? savedSorting : initialSort;
  // Keyed by value, since a reload of the preferences or an inline initialSort is a new object
  const rememberedSorting = useMemo(() => ({ order, orderBy }), [order, orderBy]);

  if (!preferenceKey) {
    return { sorting: pickedSorting, onChangeSorting: setPickedSorting };
  }

  return {
    sorting: pickedSorting ?? rememberedSorting,
    onChangeSorting: sorting => {
      setPickedSorting(sorting);
      pageSizePreferences.saveFacilityPreference({ key: preferenceKey, value: sorting });
    },
  };
};
