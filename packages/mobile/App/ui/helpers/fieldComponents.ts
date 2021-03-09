import React from 'react';

import { FieldTypes } from './fields';
import { Suggester } from './suggester';
import { Routes } from './routes';

import { TextField } from '~/ui/components/TextField/TextField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown, MultiSelectDropdown } from '~/ui/components/Dropdown';
import { Checkbox } from '~/ui/components/Checkbox';
import { NumberField } from '~/ui/components/NumberField';
import { ReadOnlyField } from '~/ui/components/ReadOnlyField';

import { AutocompleteModalField } from '../components/AutocompleteModal/AutocompleteModalField';
import { SurveyQuestionAutocomplete } from '../components/AutocompleteModal/SurveyQuestionAutocomplete';
import { useBackend } from '../hooks';
import { SurveyLink } from '../components/Forms/SurveyForm/SurveyLink';
import { SurveyResult } from '../components/Forms/SurveyForm/SurveyResult';
import { SurveyAnswerField } from '../components/Forms/SurveyForm/SurveyAnswerField';

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.MULTI_SELECT]: MultiSelectDropdown,
  [FieldTypes.AUTOCOMPLETE]: SurveyQuestionAutocomplete,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.SUBMISSION_DATE]: DateField,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CHECKBOX]: Checkbox,
  [FieldTypes.CALCULATED]: ReadOnlyField,
  [FieldTypes.SURVEY_LINK]: SurveyLink,
  [FieldTypes.SURVEY_RESULT]: SurveyResult,
  [FieldTypes.SURVEY_ANSWER]: SurveyAnswerField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.RESULT]: null,
};
