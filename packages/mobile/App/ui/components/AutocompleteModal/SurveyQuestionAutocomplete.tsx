import React from 'react';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

import { AutocompleteModalField } from './AutocompleteModalField';

export const SurveyQuestionAutocomplete = ({ ...props }) => {
  const { models } = useBackend();
  const { config } = props;

  const suggester = new Suggester(
    models[config.source],
    {
      column: config.column,
    },
    (val) => ({ label: val[config.column], value: val.id })
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