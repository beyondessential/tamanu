import React, { useCallback, useMemo, useState } from 'react';
import { SEARCHABLE_COLUMN_TYPES } from '@tamanu/constants';
import { CustomisableSearchBar } from '../../../../components/SearchBar/CustomisableSearchBar';
import { SearchField } from './SearchField';

const VISIBILITY_STATUS_KEY = 'visibilityStatus';
const AVAILABLE_FACILITIES_KEY = 'availableFacilities';
const DEFAULT_VISIBLE_FILTER_COUNT = 4;

const STRING_TYPES = new Set(['STRING', 'TEXT', 'CHAR', 'VARCHAR']);
const NUMERIC_TYPES = new Set(['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL']);

const getFieldSortOrder = col => {
  if (col.key === VISIBILITY_STATUS_KEY) return 4;
  if (col.type === 'BOOLEAN') return 3;
  if (NUMERIC_TYPES.has(col.type)) return 2;
  if (col.suggesterEndpoint || col.key === AVAILABLE_FACILITIES_KEY) return 1;
  if (STRING_TYPES.has(col.type)) return 0;
  return 0;
};

export const SearchBar = ({ columns, onSearch, selectedType }) => {
  const searchFields = useMemo(
    () =>
      columns
        .filter(
          col =>
            // Relation-backed columns aren't real columns, so they can't be searched server-side.
            !col.isRelationBacked &&
            (SEARCHABLE_COLUMN_TYPES.includes(col.type) ||
              col.suggesterEndpoint ||
              col.enumValues ||
              col.key === AVAILABLE_FACILITIES_KEY),
        )
        .sort((a, b) => getFieldSortOrder(a) - getFieldSortOrder(b)),
    [columns],
  );

  const [isExpanded, setIsExpanded] = useState(false);

  const hasAdvancedFields = searchFields.length > DEFAULT_VISIBLE_FILTER_COUNT;
  const visibleFields = searchFields.slice(0, DEFAULT_VISIBLE_FILTER_COUNT);
  const advancedFields = searchFields.slice(DEFAULT_VISIBLE_FILTER_COUNT);

  const handleSearch = useCallback(
    values => {
      // The visibility status single-select flows through like any other filter. An empty value is
      // omitted, so the server default applies (current, plus panelOnly for lab test types).
      const nonEmpty = {};
      for (const [key, value] of Object.entries(values)) {
        if (value) {
          nonEmpty[key] = value;
        }
      }
      onSearch(nonEmpty);
    },
    [onSearch],
  );

  if (searchFields.length === 0) return null;

  return (
    <CustomisableSearchBar
      onSearch={handleSearch}
      showExpandButton={hasAdvancedFields}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}

      hiddenFields={advancedFields.map(col => (
        <SearchField key={col.key} col={col} selectedType={selectedType} />
      ))}
      data-testid="searchbar-refdata"
    >
      {visibleFields.map(col => (
        <SearchField key={col.key} col={col} selectedType={selectedType} />
      ))}
    </CustomisableSearchBar>
  );
};
