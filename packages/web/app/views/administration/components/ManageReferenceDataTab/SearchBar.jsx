import React, { useCallback, useMemo, useState } from 'react';
import {
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  NONPATIENT_VISIBILITY_STATUS_VALUES,
  OTHER_REFERENCE_TYPES,
  SEARCHABLE_COLUMN_TYPES,
} from '@tamanu/constants';
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

const getAllVisibilityStatuses = selectedType =>
  selectedType === OTHER_REFERENCE_TYPES.LAB_TEST_TYPE
    ? [
        ...NONPATIENT_VISIBILITY_STATUS_VALUES,
        LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY,
        LAB_TEST_TYPE_VISIBILITY_STATUSES.REFLEX_TEST,
      ]
    : NONPATIENT_VISIBILITY_STATUS_VALUES;

export const SearchBar = ({ columns, onSearch, selectedType }) => {
  const searchFields = useMemo(
    () =>
      columns
        .filter(
          col =>
            // Relation-backed and detail columns aren't real columns on the model, so they
            // can't be searched server-side.
            !col.isRelationBacked &&
            !col.detail &&
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
      const { [VISIBILITY_STATUS_KEY]: includeHistorical, ...filters } = values;
      const nonEmpty = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      if (includeHistorical) {
        nonEmpty[VISIBILITY_STATUS_KEY] = getAllVisibilityStatuses(selectedType).join(',');
      }
      onSearch(nonEmpty);
    },
    [onSearch, selectedType],
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
