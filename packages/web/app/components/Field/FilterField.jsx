import React from 'react';
import { FilterIcon } from '../Icons/FilterIcon';
import { SuggesterSearchMultiSelectField } from './SearchMultiSelectField';

export const FilterField = props => {
  return (
    <SuggesterSearchMultiSelectField highlightOnSelect startIcon={<FilterIcon />} {...props} />
  );
};
