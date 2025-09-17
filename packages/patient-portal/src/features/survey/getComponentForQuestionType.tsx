import React from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES, PORTAL_SUGGESTER_ALLOW_LIST } from '@tamanu/constants';
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
  SurveyQuestionAutocompleteField,
  getSuggesterEndpointForConfig,
} from '@tamanu/ui-components';

const PlaceholderField = ({ label, type }: { label: string; type: string }) => {
  return (
    <Box>
      {label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>{type} field</Box>
    </Box>
  );
};

const UnSupportedField = ({
  label,
  type,
  message,
}: {
  label: string;
  type: string;
  message?: string;
}) => {
  return (
    <Box>
      {label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>
        {message ? message : `${type} field is not supported`}
      </Box>
    </Box>
  );
};

const withSaveDateAsString = (Component: React.ComponentType<any>) => (props: any) => (
  <Component {...props} saveDateAsString />
);

const PortalAutocompleteField = (props: any) => {
  const endpoint = getSuggesterEndpointForConfig(props.config);
  if (PORTAL_SUGGESTER_ALLOW_LIST.includes(endpoint)) {
    return <SurveyQuestionAutocompleteField {...props} />;
  }
  return (
    <UnSupportedField label={props.label} message={`The ${endpoint} resource is not supported`} />
  );
};

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: BaseMultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: PortalAutocompleteField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: withSaveDateAsString(DateField),
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: withSaveDateAsString(DateTimeField),
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: withSaveDateAsString(DateField),
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: UnSupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: UnSupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: UnSupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: UnSupportedField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: UnSupportedField,
};

export function getComponentForQuestionType(type: keyof typeof PROGRAM_DATA_ELEMENT_TYPES) {
  const Component = QUESTION_COMPONENTS[type];
  if (Component === PlaceholderField || Component === UnSupportedField) {
    return (props: any) => <Component {...props} type={type} />;
  }
  return Component;
}
