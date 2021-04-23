import React from 'react';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

import { AutocompleteModalField } from './AutocompleteModalField';

export const SurveyQuestionAutocomplete = ({ ...props }): JSX.Element => {
  const { models } = useBackend();
  const { source, column, ...otherOptions } = props.config;
  let columnName = column;
  if (source === 'ReferenceData') columnName = 'name'; // Removes some oft-duplicate boilerplate from survey import file

  const suggester = new Suggester(
    models[source],
    { ...otherOptions, column: columnName },
    (val) => ({ label: val[columnName], value: val.id }),
  );

  return (
    <AutocompleteModalField
      placeholder="Search..."
      suggester={suggester}
      onChange={props.onChange}
      modalRoute={Routes.Autocomplete.Modal}
      {...props}
    />
  );
};