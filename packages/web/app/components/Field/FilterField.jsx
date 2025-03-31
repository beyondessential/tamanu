import React from 'react';
import { FilterIcon } from '../Icons/FilterIcon';
import { SuggesterSearchMultiSelectField } from './SearchMultiSelectField';

export const FilterField = props => {
  return (
    <SuggesterSearchMultiSelectField
      startIcon={<FilterIcon data-testid='filtericon-0wgb' />}
      {...props}
      data-testid='suggestersearchmultiselectfield-tljg' />
  );
};
