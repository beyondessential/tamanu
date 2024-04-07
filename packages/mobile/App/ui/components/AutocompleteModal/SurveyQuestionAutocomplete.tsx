import React from 'react';
import { Suggester } from '~/ui/helpers/suggester';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useBackend } from '~/ui/hooks';
import { AutocompleteModalField } from './AutocompleteModalField';
import { SurveyScreenConfig } from '~/types';
import { getNameColumnForModel, getDisplayNameForModel } from '~/ui/helpers/fields';

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

  const suggester = new Suggester(
    models[source],
    {
      where: { ...where, ...filter },
      column: getNameColumnForModel(source),
    },
    val => ({
      label: getDisplayNameForModel(source, val),
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
