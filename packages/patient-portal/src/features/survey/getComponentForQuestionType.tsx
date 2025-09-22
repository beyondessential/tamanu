import React from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { Box } from '@mui/material';
import {
  LimitedTextField,
  MultilineTextField,
  BaseSelectField,
  BaseMultiselectField,
  ReadOnlyTextField,
  InstructionField,
  NumberField,
  DateField,
  DateTimeField,
  NullableBooleanField,
} from '@tamanu/ui-components';
import { SurveyQuestionAutocompleteField } from './SurveyQuestionAutocompleteField';

const PlaceholderField = ({ label, type }: { label: string; type: string }) => {
  return (
    <Box>
      {label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>{type} field</Box>
    </Box>
  );
};

const unsupportedField = ({ label, type }: { label: string; type?: string }) => {
  return (
    <Box>
      {label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>{`${type} field is not supported`}</Box>
    </Box>
  );
};

const withSaveDateAsString = (Component: React.ComponentType<any>) => (props: any) => (
  <Component {...props} saveDateAsString />
);

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: BaseMultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: SurveyQuestionAutocompleteField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: withSaveDateAsString(DateField),
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: withSaveDateAsString(DateTimeField),
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: withSaveDateAsString(DateField),
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null, // intentionally null
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null, // intentionally null
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: unsupportedField,
};

export function getComponentForQuestionType(type: keyof typeof PROGRAM_DATA_ELEMENT_TYPES) {
  const Component = QUESTION_COMPONENTS[type];
  if (Component === PlaceholderField || Component === unsupportedField) {
    return (props: any) => <Component {...props} type={type} />;
  }
  return Component;
}
