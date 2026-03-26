import React from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import {
  BaseMultiselectField,
  LimitedTextField,
  MultilineTextField,
  ReadOnlyTextField,
  BaseSelectField,
  InstructionField,
  PhotoField as BasePhotoField,
  PatientDataDisplayField,
} from '@tamanu/ui-components';
import { PhotoCaptureModal } from '../PhotoCaptureModal';
import {
  DateField,
  DateTimeField,
  NullableBooleanField,
  NumberField,
  SurveyResponseSelectField,
  ChartInstanceNameField,
  SurveyAnswerField,
  SurveyQuestionAutocompleteField,
} from '../Field';

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: BaseSelectField, // TODO: Implement proper radio field?
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: BaseMultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: SurveyQuestionAutocompleteField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: DateField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: DateTimeField,
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: DateField,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: SurveyResponseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null, // intentionally null
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: SurveyAnswerField,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: props => (
    <BasePhotoField {...props} WebcamCaptureModalComponent={PhotoCaptureModal} />
  ),
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null, // intentionally null
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: ChartInstanceNameField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: DateTimeField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: props => (
    <BaseSelectField {...props} clearValue="" />
  ),
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: props => (
    <BaseSelectField {...props} clearValue="" />
  ),
};

export function getComponentForQuestionType(type, { source, writeToPatient: { fieldType } = {} }) {
  let component = QUESTION_COMPONENTS[type];
  if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA) {
    if (fieldType) {
      // PatientData specifically can overwrite field type if we are writing back to patient record
      component = QUESTION_COMPONENTS[fieldType];
    } else if (source) {
      // we're displaying a relation, so use PatientDataDisplayField
      // (using a LimitedTextField will just display the bare id)
      component = PatientDataDisplayField;
    }
  }
  if (component === undefined) {
    return LimitedTextField;
  }
  return component;
}
