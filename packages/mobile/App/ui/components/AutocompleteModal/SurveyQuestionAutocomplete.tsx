import React, { useMemo } from 'react';
import { Suggester } from '~/ui/helpers/suggester';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useBackend } from '~/ui/hooks';
import { AutocompleteModalField } from './AutocompleteModalField';
import { SurveyScreenConfig } from '~/types';

function getNameColumnForModel(modelName: string): string {
  switch (modelName) {
    case 'User':
      return 'displayName';
    default:
      return 'name';
  }
}

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
    // Continue to support existing surveys with deprecated icd10 type by treating as diagnosis
    return {
      ...where,
      type: 'diagnosis',
    };
  return where;
};

const useSurveyAutocompleteWhere = (config: SurveyScreenConfig) => {
  const where = useWhere(config);
  const filter = useFilterByResource(config);
  return { ...where, ...filter };
};

export const SurveyQuestionAutocomplete = (props): JSX.Element => {
  const { models } = useBackend();
  const where = useSurveyAutocompleteWhere(props.config);
  const { source } = props.config;

  const suggester = useMemo(
    () =>
      new Suggester({
        model: models[source],
        options: {
          where,
          column: getNameColumnForModel(source),
        },
      }),
    [models, source, where],
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
