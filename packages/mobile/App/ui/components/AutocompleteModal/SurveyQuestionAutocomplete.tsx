import React from 'react';
import { SurveyScreenConfig } from '~/types';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { AutocompleteModalField } from './AutocompleteModalField';

const useFilterByResource = ({ source, scope }: SurveyScreenConfig): object => {
  const { facilityId } = useFacility();

  if (source === 'LocationGroup' && scope !== 'allFacilities') {
    return { facility: facilityId };
  }

  return {};
};

export const SurveyQuestionAutocomplete = (props): JSX.Element => {
  const { models } = useBackend();
  const filter = useFilterByResource(props.config);
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
    {
      where: { ...where, ...filter },
      column: columnName,
    },
    val => ({
      label: val[columnName],
      value: val.id,
    }),
  );

  return (
    <AutocompleteModalField
      placeholder="Search..."
      suggester={suggester}
      onChange={props.onChange}
      {...props}
    />
  );
};
