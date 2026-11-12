import React from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { FormInfoIcon } from './icons';
import { formScaled } from './styles';
import {
  CheckboxQuestion,
  MultipleChoiceQuestion,
  SingleChoiceQuestion,
  YesNoQuestion,
} from './questions/ChoiceQuestions';
import { DateQuestion, DateTimeQuestion, TimeQuestion } from './questions/DateTimeQuestions';
import { PhotoQuestion, SignatureQuestion } from './questions/MediaQuestions';
import { Hint } from './questions/QuestionLayout';
import {
  CalculatedQuestion,
  MultilineQuestion,
  NumberQuestion,
  PatientDataQuestion,
  TextQuestion,
} from './questions/TextQuestions';

const InstructionBox = styled.div`
  display: flex;
  gap: ${formScaled(14)};
  padding: ${formScaled(18)} ${formScaled(20)};
  border-radius: var(--pf-radius, 14px);
  background: var(--pf-info-tint);
  border: var(--pf-border) solid var(--pf-info-tint);
  font-size: ${formScaled(18)};
  line-height: 1.45;

  svg {
    width: ${formScaled(24)};
    height: ${formScaled(24)};
    margin-top: 1px;
    flex: none;
    color: var(--pf-info);
  }
`;

const InstructionQuestion = ({ label, helperText }) => (
  <InstructionBox>
    <FormInfoIcon />
    <div>
      {label}
      {helperText && <Hint style={{ margin: `${formScaled(6)} 0 0` }}>{helperText}</Hint>}
    </div>
  </InstructionBox>
);

/**
 * How each question type appears in a form a patient fills in. Every control stores its answer
 * in the same format as the field staff use for that type, so responses are identical wherever
 * they're filled in. Search questions use each app's own field, as the two look up options
 * differently.
 */
const PATIENT_FORM_QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: TextQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: SingleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: SingleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: MultipleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: YesNoQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: CheckboxQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: DateQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: DateTimeQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.TIME]: TimeQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: CalculatedQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: PatientDataQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT]: InstructionQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PhotoQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.SIGNATURE]: SignatureQuestion,
};

/** Information rather than a question, so shown on the page without a card around it. */
export const PLAIN_QUESTION_TYPES = new Set([
  PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
  PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT,
]);

/**
 * The question types an app's patient forms support, and the control for each.
 *
 * @param {{ AutocompleteQuestion: import('react').ComponentType }} appQuestions The app's own
 *   search field, used for autocomplete questions
 */
export const createPatientFormQuestionTypes = ({ AutocompleteQuestion }) => {
  const components = {
    ...PATIENT_FORM_QUESTION_COMPONENTS,
    [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: AutocompleteQuestion,
  };
  const isSupportedQuestionType = type => type in components;
  const getComponentForQuestionType = (type, { writeToPatient } = {}) => {
    // Questions that write back to the patient record are answered like their field type
    const fieldType = writeToPatient?.fieldType;
    if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA && isSupportedQuestionType(fieldType)) {
      return components[fieldType];
    }
    return components[type];
  };
  return { isSupportedQuestionType, getComponentForQuestionType };
};
