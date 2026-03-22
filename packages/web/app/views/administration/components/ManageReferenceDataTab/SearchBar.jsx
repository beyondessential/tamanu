import React, { memo, useCallback, useMemo, useState } from 'react';
import { startCase } from 'lodash';
import { TextField } from '@tamanu/ui-components';
import { SEARCHABLE_COLUMN_TYPES } from '@tamanu/constants';
import { Field } from '../../../../components/Field';
import { CustomisableSearchBar } from '../../../../components/SearchBar/CustomisableSearchBar';

const DEFAULT_VISIBLE_FILTER_COUNT = 4;

const renderSearchField = col => (
  <Field
    key={col.key}
    component={TextField}
    name={col.key}
    label={startCase(col.key)}
    placeholder="Search..."
    data-testid={`searchfield-${col.key}`}
  />
);

export const SearchBar = memo(({ columns, onSearch }) => {
  const searchFields = useMemo(
    () => columns.filter(col => SEARCHABLE_COLUMN_TYPES.includes(col.type)),
    [columns],
  );

  const [isExpanded, setIsExpanded] = useState(false);

  const hasAdvancedFields = searchFields.length > DEFAULT_VISIBLE_FILTER_COUNT;
  const visibleFields = searchFields.slice(0, DEFAULT_VISIBLE_FILTER_COUNT);
  const advancedFields = searchFields.slice(DEFAULT_VISIBLE_FILTER_COUNT);

  const handleSearch = useCallback(
    values => {
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
      hiddenFields={advancedFields.map(renderSearchField)}
      data-testid="searchbar-refdata"
    >
      {visibleFields.map(renderSearchField)}
    </CustomisableSearchBar>
  );
});
