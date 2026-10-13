import React, { useId } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { usePatientDataDisplayValue } from '@tamanu/ui-components';

import { TranslatedText } from '../../../../components';
import { useTranslation } from '../../../../contexts/Translation';
import { scaled } from '../../kioskStyles';
import { NarrowQuestionInput, Question, QuestionInput, setFieldValue } from './QuestionLayout';

const QuestionTextArea = styled(QuestionInput).attrs({ as: 'textarea' })`
  display: block;
  min-height: ${scaled(128)};
  padding: ${scaled(16)} ${scaled(20)};
  line-height: 1.4;
  resize: none;
  overflow: hidden;
  field-sizing: content;
`;

const growToFitContent = event => {
  const textArea = event.currentTarget;
  textArea.style.height = 'auto';
  textArea.style.height = `${textArea.scrollHeight}px`;
};

/** A typed answer. `Input` decides the control; `toValue` turns what was typed into the answer. */
const EntryQuestion = ({
  field,
  label,
  required,
  error,
  helperText,
  disabled,
  Input = QuestionInput,
  toValue = value => value,
  ...inputProps
}) => {
  const inputId = useId();
  return (
    <Question {...{ label, required, error, helperText, inputId }}>
      <Input
        id={inputId}
        name={field.name}
        value={field.value ?? ''}
        onChange={event => setFieldValue(field, toValue(event.target.value))}
        disabled={disabled}
        aria-invalid={error}
        aria-required={required}
        autoComplete="off"
        {...inputProps}
      />
    </Question>
  );
};

export const TextQuestion = props => <EntryQuestion {...props} maxLength={255} />;

/** Grows taller as the patient types, so everything they've written stays in view. */
export const MultilineQuestion = props => (
  <EntryQuestion {...props} Input={QuestionTextArea} onInput={growToFitContent} />
);

/** An empty box is no answer, rather than a number the validation can't read. */
export const NumberQuestion = props => (
  <EntryQuestion
    {...props}
    Input={NarrowQuestionInput}
    inputMode="decimal"
    toValue={value => (value === '' ? null : value)}
  />
);

const ReadOnlyQuestion = ({ label, hint, value, placeholder, Input = QuestionInput }) => {
  const inputId = useId();
  return (
    <Question label={label} inputId={inputId} hint={hint}>
      <Input id={inputId} value={value ?? ''} placeholder={placeholder} readOnly tabIndex={-1} />
    </Question>
  );
};

export const CalculatedQuestion = ({ field, label }) => (
  <ReadOnlyQuestion
    label={label}
    value={field.value}
    Input={NarrowQuestionInput}
    hint={
      <TranslatedText
        stringId="kiosk.question.calculated"
        fallback="Calculated from your answers"
      />
    }
  />
);

const patientRecordHint = (
  <TranslatedText stringId="kiosk.question.patientData" fallback="From your patient record" />
);

/** A value shown from the patient record. Relations, like a village, show their name. */
export const PatientDataQuestion = ({ field, label, config }) => {
  const { getTranslation } = useTranslation();
  const { getDisplayValue } = usePatientDataDisplayValue();
  const isRelation = Boolean(config?.source);
  const { data: relationName } = useQuery(
    ['kioskPatientDataDisplay', config?.column, field.value],
    () => getDisplayValue(field.value, config),
    { enabled: isRelation && Boolean(field.value) },
  );

  return (
    <ReadOnlyQuestion
      label={label}
      hint={patientRecordHint}
      value={isRelation ? relationName : field.value}
      placeholder={getTranslation('kiosk.question.notRecorded', 'Not recorded')}
    />
  );
};
