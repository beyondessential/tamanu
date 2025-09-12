import React from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { Box } from '@mui/material';
import {
  LimitedTextField,
  MultilineTextField,
  BaseSelectField,
  BaseMultiselectField,
  ReadOnlyTextField,
} from '@tamanu/ui-components';
import { type Survey } from '@tamanu/shared/schemas/patientPortal';

const PlaceholderField = ({ label, type }: { label: string; type: string }) => {
  return (
    <Box>
      {label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>{type} field</Box>
    </Box>
  );
};

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: BaseMultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: PlaceholderField,
};

export function getComponentForQuestionType(type: Survey['surveyType']) {
  const Component = QUESTION_COMPONENTS[type];
  // @ts-ignore: just adding type to component props for developing the question types
  return props => <Component {...props} type={type} />;
}
