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

const useWhere = ({
  where,
  source,
}: SurveyScreenConfig & {
  where?: {
    type: string;
  };
}) => {
  if (source === 'ReferenceData' && where?.type === 'icd10')
    return {
      ...where,
      type: 'diagnosis',
    };
  return where;
};

const useSurveyAutocompleteWhere = (config: SurveyScreenConfig): object => {
  const where = useWhere(config);
  const filter = useFilterByResource(config);
  return { ...where, ...filter };
};

export const SurveyQuestionAutocomplete = (props): JSX.Element => {
  const { models } = useBackend();
  const where = useSurveyAutocompleteWhere(props.config);
  const { source } = props.config;

  const suggester = new Suggester(
    models[source],
    {
      where,
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
