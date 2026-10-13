import React, { useId, useState } from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { PatientDataDisplayField, PhotoField, SignatureField } from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import {
  DateTimeField,
  SurveyQuestionAutocompleteField,
  TimeField,
} from '../../../components/Field';
import { PhotoCaptureModal } from '../../../components/PhotoCaptureModal';
import { ViewPhotoLink } from '../../../components/ViewPhotoLink';
import { useTranslation } from '../../../contexts/Translation';
import { MONTHS, toDateParts, toDateString } from '../kioskDates';
import { CheckIcon, InfoIcon } from '../KioskIcons';
import { ErrorMessage, KioskInput, KioskSelect, scaled, SubLabel } from '../kioskStyles';

const QuestionText = styled.div`
  display: block;
  margin-bottom: ${scaled(16)};
  font-size: ${scaled(20)};
  font-weight: 500;
  line-height: 1.35;
  color: var(--kiosk-text);
`;

const Hint = styled.div`
  margin: ${scaled(-8)} 0 ${scaled(14)};
  font-size: ${scaled(15)};
  color: var(--kiosk-text-tertiary);
`;

const RequiredMark = styled.span`
  color: var(--kiosk-alert);
  font-weight: 500;
`;

const QuestionInput = styled(KioskInput)`
  min-height: ${scaled(60)};
  padding: 0 ${scaled(20)};
  font-size: ${scaled(20)};
`;

const QuestionSelect = styled(KioskSelect)`
  min-height: ${scaled(60)};
  font-size: ${scaled(20)};
`;

const QuestionTextArea = styled(QuestionInput).attrs({ as: 'textarea' })`
  display: block;
  min-height: ${scaled(128)};
  padding: ${scaled(16)} ${scaled(20)};
  line-height: 1.4;
  resize: none;
  overflow: hidden;
  field-sizing: content;
`;

const NarrowInput = styled(QuestionInput)`
  width: ${scaled(180)};
`;

/**
 * The question text, hint and validation message around a kiosk control. Errors only show once
 * the patient has tried to move on (the shared `Field` passes the message as `helperText` then).
 */
const Question = ({ label, required, helperText, error, inputId, children, hint }) => (
  <>
    <QuestionText as={inputId ? 'label' : 'div'} htmlFor={inputId}>
      {label}
      {required && <RequiredMark aria-hidden="true"> *</RequiredMark>}
    </QuestionText>
    {(hint || (!error && helperText)) && <Hint>{hint ?? helperText}</Hint>}
    {children}
    {error && helperText && <ErrorMessage role="alert">{helperText}</ErrorMessage>}
  </>
);

const setValue = (field, value) => field.onChange({ target: { name: field.name, value } });

const TextQuestion = ({ field, label, required, error, helperText, disabled }) => {
  const inputId = useId();
  return (
    <Question {...{ label, required, error, helperText, inputId }}>
      <QuestionInput
        id={inputId}
        name={field.name}
        value={field.value ?? ''}
        onChange={field.onChange}
        maxLength={255}
        disabled={disabled}
        aria-invalid={error}
        aria-required={required}
        autoComplete="off"
      />
    </Question>
  );
};

const growToFitContent = event => {
  const textArea = event.currentTarget;
  textArea.style.height = 'auto';
  textArea.style.height = `${textArea.scrollHeight}px`;
};

const MultilineQuestion = ({ field, label, required, error, helperText, disabled }) => {
  const inputId = useId();
  return (
    <Question {...{ label, required, error, helperText, inputId }}>
      <QuestionTextArea
        id={inputId}
        name={field.name}
        value={field.value ?? ''}
        onChange={field.onChange}
        onInput={growToFitContent}
        disabled={disabled}
        aria-invalid={error}
        aria-required={required}
      />
    </Question>
  );
};

const NumberQuestion = ({ field, label, required, error, helperText, disabled }) => {
  const inputId = useId();
  return (
    <Question {...{ label, required, error, helperText, inputId }}>
      <NarrowInput
        id={inputId}
        name={field.name}
        value={field.value ?? ''}
        onChange={event => setValue(field, event.target.value === '' ? null : event.target.value)}
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={error}
        aria-required={required}
        autoComplete="off"
      />
    </Question>
  );
};

const ReadOnlyQuestion = ({ field, label, hint }) => {
  const inputId = useId();
  const { getTranslation } = useTranslation();
  return (
    <Question label={label} inputId={inputId} hint={hint}>
      <QuestionInput
        id={inputId}
        value={field.value ?? ''}
        placeholder={getTranslation('kiosk.question.notRecorded', 'Not recorded')}
        readOnly
        tabIndex={-1}
      />
    </Question>
  );
};

const CalculatedQuestion = props => (
  <NarrowReadOnly
    {...props}
    hint={
      <TranslatedText
        stringId="kiosk.question.calculated"
        fallback="Calculated from your answers"
      />
    }
  />
);

const NarrowReadOnly = props => (
  <div style={{ maxWidth: scaled(180) }}>
    <ReadOnlyQuestion {...props} />
  </div>
);

const PatientDataQuestion = props => (
  <ReadOnlyQuestion
    {...props}
    hint={
      <TranslatedText stringId="kiosk.question.patientData" fallback="From your patient record" />
    }
  />
);

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

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${scaled(10)};
`;

const PillOption = styled.button.attrs({ type: 'button' })`
  min-width: ${scaled(120)};
  min-height: ${scaled(56)};
  padding: 0 ${scaled(24)};
  border: none;
  border-radius: 14px;
  background: var(--kiosk-option);
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
  color: var(--kiosk-text);
  font-size: ${scaled(18)};
  font-weight: 500;
  cursor: pointer;

  &[aria-checked='true'] {
    background: var(--kiosk-primary);
    box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-primary);
    color: var(--kiosk-on-primary);
  }
`;

const ListOption = styled.button.attrs({ type: 'button' })`
  width: 100%;
  min-height: ${scaled(58)};
  padding: ${scaled(10)} ${scaled(18)};
  display: flex;
  align-items: center;
  gap: ${scaled(14)};
  border: none;
  border-radius: 14px;
  background: var(--kiosk-surface);
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
  color: var(--kiosk-text);
  font-size: ${scaled(18)};
  text-align: left;
  cursor: pointer;

  & + & {
    margin-top: ${scaled(8)};
  }

  &[aria-checked='true'] {
    background: var(--kiosk-primary-tint);
    box-shadow: inset 0 0 0 2px var(--kiosk-primary);
    color: var(--kiosk-heading);
    font-weight: 500;
  }
`;

const RadioMark = styled.span`
  width: ${scaled(24)};
  height: ${scaled(24)};
  flex: none;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--kiosk-outline);

  [aria-checked='true'] > & {
    box-shadow: inset 0 0 0 ${scaled(7)} var(--kiosk-primary);
  }
`;

const CheckMark = styled.span`
  width: ${scaled(26)};
  height: ${scaled(26)};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  box-shadow: inset 0 0 0 2px var(--kiosk-outline);
  background: var(--kiosk-surface);
  color: var(--kiosk-on-primary);

  svg {
    display: none;
    width: 70%;
    height: 70%;
  }

  [aria-checked='true'] > & {
    background: var(--kiosk-primary);
    box-shadow: none;

    svg {
      display: block;
    }
  }
`;

const ErrorOutline = styled.div`
  border-radius: 14px;

  &[data-invalid='true'] {
    box-shadow: 0 0 0 2px var(--kiosk-alert);
  }
`;

/** Long option lists are easier to scan in a dropdown than as a column of buttons. */
const MAX_LISTED_OPTIONS = 8;

const SingleChoiceQuestion = ({ field, label, required, error, helperText, options = [] }) => {
  const inputId = useId();
  if (options.length > MAX_LISTED_OPTIONS) {
    return (
      <Question {...{ label, required, error, helperText, inputId }}>
        <QuestionSelect
          id={inputId}
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          aria-invalid={error}
          aria-required={required}
        >
          <option value="" disabled hidden>
            {/* Native selects need a blank first option to show no answer yet */}
          </option>
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </QuestionSelect>
      </Question>
    );
  }

  return (
    <Question {...{ label, required, error, helperText }}>
      <ErrorOutline role="radiogroup" aria-label={field.name} data-invalid={error}>
        {options.map(({ value, label: optionLabel }) => (
          <ListOption
            key={value}
            role="radio"
            aria-checked={field.value === value}
            onClick={() => setValue(field, value)}
          >
            <RadioMark />
            {optionLabel}
          </ListOption>
        ))}
      </ErrorOutline>
    </Question>
  );
};

const parseSelectedValues = value => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const MultipleChoiceQuestion = ({ field, label, required, error, helperText, options = [] }) => {
  const selectedValues = parseSelectedValues(field.value);
  const toggle = value => {
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter(selected => selected !== value)
      : [...selectedValues, value];
    setValue(field, nextValues.length > 0 ? JSON.stringify(nextValues) : null);
  };

  return (
    <Question
      {...{ label, required, error, helperText }}
      hint={<TranslatedText stringId="kiosk.question.selectAll" fallback="Select all that apply" />}
    >
      <ErrorOutline role="group" data-invalid={error}>
        {options.map(({ value, label: optionLabel }) => (
          <ListOption
            key={value}
            role="checkbox"
            aria-checked={selectedValues.includes(value)}
            onClick={() => toggle(value)}
          >
            <CheckMark>
              <CheckIcon />
            </CheckMark>
            {optionLabel}
          </ListOption>
        ))}
      </ErrorOutline>
    </Question>
  );
};

const isTrue = value => value === true || value === 'true' || value === 'Yes';
const isFalse = value => value === false || value === 'false' || value === 'No';

const YesNoQuestion = ({ field, label, required, error, helperText }) => (
  <Question {...{ label, required, error, helperText }}>
    <ButtonRow role="radiogroup">
      <PillOption
        role="radio"
        aria-checked={isTrue(field.value)}
        onClick={() => setValue(field, 'true')}
      >
        <TranslatedText stringId="general.action.yes" fallback="Yes" />
      </PillOption>
      <PillOption
        role="radio"
        aria-checked={isFalse(field.value)}
        onClick={() => setValue(field, 'false')}
      >
        <TranslatedText stringId="general.action.no" fallback="No" />
      </PillOption>
    </ButtonRow>
  </Question>
);

const ConsentOption = styled(ListOption)`
  align-items: flex-start;
  padding: ${scaled(4)} 0;
  box-shadow: none;
  background: none;
  line-height: 1.45;

  &[aria-checked='true'] {
    background: none;
    box-shadow: none;
    font-weight: normal;
    color: var(--kiosk-text);
  }
`;

const CheckboxQuestion = ({ field, label, required, error, helperText }) => (
  <>
    <ConsentOption
      role="checkbox"
      aria-checked={isTrue(field.value)}
      onClick={() => setValue(field, isTrue(field.value) ? 'false' : 'true')}
    >
      <CheckMark>
        <CheckIcon />
      </CheckMark>
      <span>
        {label}
        {required && <RequiredMark aria-hidden="true"> *</RequiredMark>}
      </span>
    </ConsentOption>
    {error && helperText && <ErrorMessage role="alert">{helperText}</ErrorMessage>}
  </>
);

const DateParts = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.8fr 1.3fr;
  gap: ${scaled(12)};
  max-width: ${scaled(520)};
`;

/** A date entered as day, month by name and year, the same way patients enter their date of birth. */
const DateQuestion = ({ field, label, required, error, helperText }) => {
  const { getTranslation } = useTranslation();
  const idPrefix = useId();
  const [parts, setParts] = useState(() => toDateParts(field.value));

  const updatePart = part => event => {
    const value = part === 'month' ? event.target.value : event.target.value.replace(/\D/g, '');
    const nextParts = { ...parts, [part]: value };
    setParts(nextParts);
    setValue(field, toDateString(nextParts));
  };

  return (
    <Question {...{ label, required, error, helperText }}>
      <DateParts>
        <div>
          <SubLabel htmlFor={`${idPrefix}-day`}>
            <TranslatedText stringId="kiosk.date.day" fallback="Day" />
          </SubLabel>
          <QuestionInput
            id={`${idPrefix}-day`}
            value={parts.day}
            onChange={updatePart('day')}
            inputMode="numeric"
            maxLength={2}
            autoComplete="off"
            aria-invalid={error}
          />
        </div>
        <div>
          <SubLabel htmlFor={`${idPrefix}-month`}>
            <TranslatedText stringId="kiosk.date.month" fallback="Month" />
          </SubLabel>
          <QuestionSelect
            id={`${idPrefix}-month`}
            value={parts.month}
            onChange={updatePart('month')}
            aria-invalid={error}
          >
            <option value="" disabled hidden>
              {getTranslation('kiosk.date.selectMonth', 'Select')}
            </option>
            {MONTHS.map(({ stringId, fallback }, index) => (
              <option key={stringId} value={String(index + 1)}>
                {getTranslation(stringId, fallback)}
              </option>
            ))}
          </QuestionSelect>
        </div>
        <div>
          <SubLabel htmlFor={`${idPrefix}-year`}>
            <TranslatedText stringId="kiosk.date.year" fallback="Year" />
          </SubLabel>
          <QuestionInput
            id={`${idPrefix}-year`}
            value={parts.year}
            onChange={updatePart('year')}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            aria-invalid={error}
          />
        </div>
      </DateParts>
    </Question>
  );
};

const KioskPhotoField = props => (
  <PhotoField
    {...props}
    WebcamCaptureModalComponent={PhotoCaptureModal}
    ViewPhotoLinkComponent={ViewPhotoLink}
  />
);

/** How each question type appears at the kiosk. Types not listed are left out of kiosk forms. */
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
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: DateTimeField,
  [PROGRAM_DATA_ELEMENT_TYPES.TIME]: TimeField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: CalculatedQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: PatientDataQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT]: InstructionQuestion,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: KioskPhotoField,
  [PROGRAM_DATA_ELEMENT_TYPES.SIGNATURE]: SignatureField,
};

export const isKioskQuestionType = type => type in KIOSK_QUESTION_COMPONENTS;

export function getKioskComponentForQuestionType(type, { source, writeToPatient } = {}) {
  if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA) {
    // Questions that write back to the patient record are answered like their field type
    const fieldType = writeToPatient?.fieldType;
    if (fieldType && isKioskQuestionType(fieldType)) return KIOSK_QUESTION_COMPONENTS[fieldType];
    // Relations (e.g. village) need their display name looked up rather than showing an ID
    if (source) return PatientDataDisplayField;
  }
  return KIOSK_QUESTION_COMPONENTS[type];
}
