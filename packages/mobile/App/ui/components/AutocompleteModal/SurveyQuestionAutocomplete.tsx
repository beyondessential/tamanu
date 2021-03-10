import React from 'react';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

import { AutocompleteModalField } from './AutocompleteModalField';

/**
 * 
 * @param {Object} models Contains backend models.
 * @param {string} source Target model name.
 */
function createSuggester(models, config) {
  return new Suggester(
    models[config.source],
    {},
  );
}

export const SurveyQuestionAutocomplete = ({ component, ...props }) => {
  const { models } = useBackend();
  const config = component.getConfigObject();

  return (
    <AutocompleteModalField
      placeholder="Search..."
      suggester={createSuggester(models, config)}
      modalRoute={Routes.Autocomplete.Modal}
      {...props}
    />
  );
};