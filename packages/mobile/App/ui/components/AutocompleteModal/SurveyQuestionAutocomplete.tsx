import React from 'react';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

import { AutocompleteModalField } from './AutocompleteModalField';

const SOURCE_TO_COLUMN_MAP = {
  ReferenceData: 'name',
  User: 'displayName',
};

export const SurveyQuestionAutocomplete = ({ ...props }): JSX.Element => {
  const { models } = useBackend();
  const { source, where } = props.config;

  const columnName = SOURCE_TO_COLUMN_MAP[source];

  const suggester = new Suggester(
    models[source],
    { where, column: columnName },
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
