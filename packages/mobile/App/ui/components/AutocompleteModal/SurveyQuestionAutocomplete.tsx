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

const EMPTY_FILTER: Record<string, never> = {};

const useFilterByResource = ({ source, scope }: SurveyScreenConfig): object => {
  const { facilityId } = useFacility();
  const hasFacilityFilter = source === 'LocationGroup' && scope !== 'allFacilities';
  return useMemo(
    () => (hasFacilityFilter ? { facility: facilityId } : EMPTY_FILTER),
    [hasFacilityFilter, facilityId],
  );
};

const useWhere = ({
  where,
  source,
}: SurveyScreenConfig & {
  where?: {
    type: string;
  };
}) =>
  useMemo(() => {
    if (source === 'ReferenceData' && where?.type === 'icd10') {
      return { ...where, type: 'diagnosis' };
    }
    return where;
  }, [source, where]);

const useSurveyAutocompleteWhere = (config: SurveyScreenConfig) => {
  const where = useWhere(config);
  const filter = useFilterByResource(config);
  return useMemo(() => ({ ...where, ...filter }), [where, filter]);
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
