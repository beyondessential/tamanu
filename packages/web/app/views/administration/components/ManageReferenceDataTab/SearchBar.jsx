import React, { useCallback, useMemo, useState } from 'react';
import { SEARCHABLE_COLUMN_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { CustomisableSearchBar } from '../../../../components/SearchBar/CustomisableSearchBar';
import { SearchField } from './SearchField';

const VISIBILITY_STATUS_KEY = 'visibilityStatus';
const DEFAULT_VISIBLE_FILTER_COUNT = 4;

const STRING_TYPES = new Set(['STRING', 'TEXT', 'CHAR', 'VARCHAR']);
const NUMERIC_TYPES = new Set(['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL']);

const getFieldSortOrder = col => {
  if (col.key === VISIBILITY_STATUS_KEY) return 4;
  if (col.type === 'BOOLEAN') return 3;
  if (NUMERIC_TYPES.has(col.type)) return 2;
  if (col.suggesterEndpoint) return 1;
  if (STRING_TYPES.has(col.type)) return 0;
  return 0;
};

export const SearchBar = ({ columns, onSearch }) => {
  const searchFields = useMemo(
    () =>
      columns
        .filter(col => SEARCHABLE_COLUMN_TYPES.includes(col.type) || col.suggesterEndpoint)
        .sort((a, b) => getFieldSortOrder(a) - getFieldSortOrder(b)),
    [columns],
  );

  const [isExpanded, setIsExpanded] = useState(false);

  const hasAdvancedFields = searchFields.length > DEFAULT_VISIBLE_FILTER_COUNT;
  const visibleFields = searchFields.slice(0, DEFAULT_VISIBLE_FILTER_COUNT);
  const advancedFields = searchFields.slice(DEFAULT_VISIBLE_FILTER_COUNT);

  const hasVisibilityStatus = useMemo(
    () => columns.some(col => col.key === VISIBILITY_STATUS_KEY),
    [columns],
  );

  const handleSearch = useCallback(
    values => {
      const nonEmpty = {};
      for (const [key, value] of Object.entries(values)) {
        if (key === VISIBILITY_STATUS_KEY) continue;
        if (value) {
          nonEmpty[key] = value;
        }
      }
      // When "Include historical" is unchecked, filter to current only
      if (hasVisibilityStatus && !values[VISIBILITY_STATUS_KEY]) {
        nonEmpty[VISIBILITY_STATUS_KEY] = VISIBILITY_STATUSES.CURRENT;
      }
      onSearch(nonEmpty);
    },
    [onSearch, hasVisibilityStatus],
  );

  if (searchFields.length === 0) return null;

  return (
    <CustomisableSearchBar
      onSearch={handleSearch}
      showExpandButton={hasAdvancedFields}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      hiddenFields={advancedFields.map(col => (
        <SearchField key={col.key} col={col} />
      ))}
      data-testid="searchbar-refdata"
    >
      {visibleFields.map(col => (
        <SearchField key={col.key} col={col} />
      ))}
    </CustomisableSearchBar>
  );
};
