import React from 'react';

import { FieldTypes } from './fields';
import { Suggester } from './suggester';
import { Routes } from './routes';

import { TextField } from '~/ui/components/TextField/TextField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown } from '~/ui/components/Dropdown';
import { Checkbox } from '~/ui/components/Checkbox';
import { NumberField } from '~/ui/components/NumberField';
import { ReadOnlyField } from '~/ui/components/ReadOnlyField';

import { AutocompleteModalField } from '../components/AutocompleteModal/AutocompleteModalField';
import { useBackend } from '../hooks';
import { SurveyLink } from '../components/Forms/SurveyForm/SurveyLink';
import { SurveyResult } from '../components/Forms/SurveyForm/SurveyResult';
import { SurveyAnswerField } from '../components/Forms/SurveyForm/SurveyAnswerField';

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

const MultiSelectDropdown = ({ ...props }): Element => <Dropdown multiselect={true} {...props} />;

const SurveyQuestionAutocomplete = ({ component, ...props }) => {
  const { models } = useBackend();
  const { dataElement } = component;
  const config = component.getConfigObject();

  return (
    <AutocompleteModalField
      placeholder={dataElement.defaultText}
      suggester={createSuggester(models, config)}
      modalRoute={Routes.Autocomplete.Modal}
      {...props}
    />
  );
};

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.MULTI_SELECT]: MultiSelectDropdown,
  [FieldTypes.AUTOCOMPLETE]: SurveyQuestionAutocomplete,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.SUBMISSION_DATE]: DateField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CHECKBOX]: Checkbox,
  [FieldTypes.CALCULATED]: ReadOnlyField,
  [FieldTypes.SURVEY_LINK]: SurveyLink,
  [FieldTypes.SURVEY_RESULT]: SurveyResult,
  [FieldTypes.SURVEY_ANSWER]: SurveyAnswerField,
  [FieldTypes.RESULT]: null,
};
