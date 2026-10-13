import React from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { SurveyQuestionAutocompleteField } from '../../../components/Field';
import { InfoIcon } from '../KioskIcons';
import { scaled } from '../kioskStyles';
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
  gap: ${scaled(14)};
  padding: ${scaled(18)} ${scaled(20)};
  border-radius: 14px;
  background: var(--kiosk-info-tint);
  border: var(--kiosk-border) solid var(--kiosk-info-tint);
  font-size: ${scaled(18)};
  line-height: 1.45;

  svg {
    width: ${scaled(24)};
    height: ${scaled(24)};
    margin-top: 1px;
    flex: none;
    color: var(--kiosk-info);
  }
`;

const InstructionQuestion = ({ label, helperText }) => (
  <InstructionBox>
    <InfoIcon />
    <div>
      {label}
      {helperText && <Hint style={{ margin: `${scaled(6)} 0 0` }}>{helperText}</Hint>}
    </div>
  </InstructionBox>
);

/**
 * How each question type appears at the kiosk. Every control stores its answer in the same
 * format as the field the web uses for that type, so responses are identical wherever they're
 * filled in. Types not listed are left out of kiosk forms.
 */
const KIOSK_QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: TextQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: SingleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: SingleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: MultipleChoiceQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: YesNoQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: CheckboxQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: SurveyQuestionAutocompleteField,
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

export const isKioskQuestionType = type => type in KIOSK_QUESTION_COMPONENTS;

export function getKioskComponentForQuestionType(type, { writeToPatient } = {}) {
  // Questions that write back to the patient record are answered like their field type
  const fieldType = writeToPatient?.fieldType;
  if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA && isKioskQuestionType(fieldType)) {
    return KIOSK_QUESTION_COMPONENTS[fieldType];
  }
  return KIOSK_QUESTION_COMPONENTS[type];
}
