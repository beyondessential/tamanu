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
  PhotoField,
  PatientDataDisplayField,
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
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PhotoField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null, // intentionally null
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: unsupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: unsupportedField,
};

interface GetComponentForQuestionTypeArgs {
  type: keyof typeof PROGRAM_DATA_ELEMENT_TYPES;
  source?: string;
  writeToPatient?: {
    fieldType?: keyof typeof PROGRAM_DATA_ELEMENT_TYPES;
  };
}

export function getComponentForQuestionType({
  type,
  source,
  writeToPatient: { fieldType } = {},
}: GetComponentForQuestionTypeArgs) {
  let Component = QUESTION_COMPONENTS[type];

  if (Component === PlaceholderField || Component === unsupportedField) {
    const TypedComponent = Component as React.ComponentType<any>;
    return (props: any) => <TypedComponent {...props} type={type} />;
  }

  if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA) {
    if (fieldType && fieldType in QUESTION_COMPONENTS) {
      // PatientData specifically can overwrite field type if we are writing back to patient record
      Component = QUESTION_COMPONENTS[fieldType];
    } else if (source) {
      // we're displaying a relation, so use PatientDataDisplayField
      // (using a LimitedTextField will just display the bare id)
      Component = PatientDataDisplayField as any;
    }
  }
  if (Component === undefined || Component === null) {
    return LimitedTextField;
  }
  return Component as React.ComponentType<any>;
}
