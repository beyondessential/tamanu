import React from 'react';
import { SuggesterSearchMultiSelectField } from './SearchMultiSelectField';
import { FilterIcon } from '../Icons/FilterIcon';

export const FilterField = ({ ...props }) => {
  return <SuggesterSearchMultiSelectField startIcon={<FilterIcon />} {...props} />;
};
