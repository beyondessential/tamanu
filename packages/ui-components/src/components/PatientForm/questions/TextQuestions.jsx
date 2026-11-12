import React, { useEffect, useId, useState } from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../../contexts';
import { usePatientDataDisplayValue } from '../../../hooks';
import { TranslatedText } from '../../Translation';
import { formScaled, FormInput } from '../styles';
import { NarrowFormInput, Question, setFieldValue } from './QuestionLayout';

const QuestionTextArea = styled(FormInput).attrs({ as: 'textarea' })`
  display: block;
  min-height: ${formScaled(128)};
  padding: ${formScaled(16)} ${formScaled(20)};
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
  Input = FormInput,
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
    Input={NarrowFormInput}
    inputMode="decimal"
    toValue={value => (value === '' ? null : value)}
  />
);

const ReadOnlyQuestion = ({ label, hint, value, placeholder, Input = FormInput }) => {
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
    Input={NarrowFormInput}
    hint={
      <TranslatedText
        stringId="patientForm.question.calculated"
        fallback="Calculated from your answers"
      />
    }
  />
);

const patientRecordHint = (
  <TranslatedText stringId="patientForm.question.patientData" fallback="From your patient record" />
);

/** The name of a related record (like a village) a patient data question holds the ID of. */
const useRelationName = (value, column, isRelation) => {
  const { getDisplayValue } = usePatientDataDisplayValue();
  const [relation, setRelation] = useState({ value: null, name: null });
  const shouldLookUp = isRelation && Boolean(value);

  useEffect(() => {
    if (!shouldLookUp) return undefined;
    let isCurrent = true;
    getDisplayValue(value, { column }).then(name => {
      if (!isCurrent) return;
      // Kept as is when unchanged, so a lookup function that changes each render can't loop
      setRelation(previous =>
        previous.value === value && previous.name === name ? previous : { value, name },
      );
    });
    return () => {
      isCurrent = false;
    };
  }, [shouldLookUp, value, column, getDisplayValue]);

  return relation.value === value ? relation.name : null;
};

/** A value shown from the patient record. Relations, like a village, show their name. */
export const PatientDataQuestion = ({ field, label, config }) => {
  const { getTranslation } = useTranslation();
  const isRelation = Boolean(config?.source);
  const relationName = useRelationName(field.value, config?.column, isRelation);

  return (
    <ReadOnlyQuestion
      label={label}
      hint={patientRecordHint}
      value={isRelation ? relationName : field.value}
      placeholder={getTranslation('patientForm.question.notRecorded', 'Not recorded')}
    />
  );
};
