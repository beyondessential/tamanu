import React from 'react';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';
import { useBackend } from '~/ui/hooks';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

import { AutocompleteModalField } from './AutocompleteModalField';

export const SurveyQuestionAutocomplete = ({ ...props }): JSX.Element => {
  const { models } = useBackend();
  const { source, where } = props.config;

  const columnName = AutocompleteSourceToColumnMap[source];

  if (!columnName) {
    return (
      <StyledText color={theme.colors.ALERT} fontWeight="bold">
        Error: invalid source supplied for Autocomplete question: {props.name}
      </StyledText>
    );
  }

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
