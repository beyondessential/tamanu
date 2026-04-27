import { SURVEY_TYPES } from '@tamanu/constants';
import { Field, SelectField, TranslatedText } from '@tamanu/ui-components';
import React from 'react';
import styled from 'styled-components';

const nullableBooleanOptions = /** @type {const} */ ([
  {
    value: true,
    label: <TranslatedText stringId="general.boolean.true" fallback="True" />,
  },
  {
    value: false,
    label: <TranslatedText stringId="general.boolean.false" fallback="False" />,
  },
]);

export const NullableBooleanSelect = styled(Field).attrs({
  component: SelectField,
  isClearable: false,
  options: nullableBooleanOptions,
})`
  .MuiFormControl-root {
    text-transform: uppercase;
  }
`;

/** @type {{ value: (typeof SURVEY_TYPES)[keyof typeof SURVEY_TYPES]; label: string }[]} */
export const surveyTypeOptions = Object.values(SURVEY_TYPES).map(value => ({
  value,
  label: value,
}));

export function SurveyTypeField({ isClearable = false, ...props }) {
  return (
    <Field
      {...props}
      component={SelectField}
      isClearable={isClearable}
      options={surveyTypeOptions}
    />
  );
}
