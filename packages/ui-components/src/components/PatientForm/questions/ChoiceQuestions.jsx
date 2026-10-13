import React, { useId } from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../../contexts';
import { TranslatedText } from '../../Translation';
import { FormCheckIcon } from '../icons';
import { FormErrorMessage, formScaled, FormSelect } from '../styles';
import { ErrorOutline, Question, RequiredMark, setFieldValue } from './QuestionLayout';

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${formScaled(10)};
`;

const PillOption = styled.button.attrs({ type: 'button' })`
  min-width: ${formScaled(120)};
  min-height: ${formScaled(56)};
  padding: 0 ${formScaled(24)};
  border: none;
  border-radius: var(--pf-radius, 14px);
  background: var(--pf-option);
  box-shadow: inset 0 0 0 var(--pf-border) var(--pf-outline);
  color: var(--pf-text);
  font-size: ${formScaled(18)};
  font-weight: 500;
  cursor: pointer;

  &[aria-checked='true'] {
    background: var(--pf-primary);
    box-shadow: inset 0 0 0 var(--pf-border) var(--pf-primary);
    color: var(--pf-on-primary);
  }
`;

const ListOption = styled.button.attrs({ type: 'button' })`
  width: 100%;
  min-height: ${formScaled(58)};
  padding: ${formScaled(10)} ${formScaled(18)};
  display: flex;
  align-items: center;
  gap: ${formScaled(14)};
  border: none;
  border-radius: var(--pf-radius, 14px);
  background: var(--pf-surface);
  box-shadow: inset 0 0 0 var(--pf-border) var(--pf-outline);
  color: var(--pf-text);
  font-size: ${formScaled(18)};
  text-align: left;
  cursor: pointer;

  & + & {
    margin-top: ${formScaled(8)};
  }

  &[aria-checked='true'] {
    background: var(--pf-primary-tint);
    box-shadow: inset 0 0 0 2px var(--pf-primary);
    color: var(--pf-heading);
    font-weight: 500;
  }
`;

const RadioMark = styled.span`
  width: ${formScaled(24)};
  height: ${formScaled(24)};
  flex: none;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--pf-outline);

  [aria-checked='true'] > & {
    box-shadow: inset 0 0 0 ${formScaled(7)} var(--pf-primary);
  }
`;

const CheckMark = styled.span`
  width: ${formScaled(26)};
  height: ${formScaled(26)};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  box-shadow: inset 0 0 0 2px var(--pf-outline);
  background: var(--pf-surface);
  color: var(--pf-on-primary);

  svg {
    display: none;
    width: 70%;
    height: 70%;
  }

  [aria-checked='true'] > & {
    background: var(--pf-primary);
    box-shadow: none;

    svg {
      display: block;
    }
  }
`;

const Tick = () => (
  <CheckMark>
    <FormCheckIcon />
  </CheckMark>
);

/** Long option lists are easier to scan in a dropdown than as a column of buttons. */
const MAX_LISTED_OPTIONS = 8;

const DropdownQuestion = ({ field, label, required, error, helperText, options }) => {
  const inputId = useId();
  const { getTranslation } = useTranslation();
  return (
    <Question {...{ label, required, error, helperText, inputId }}>
      <FormSelect
        id={inputId}
        name={field.name}
        value={field.value ?? ''}
        onChange={field.onChange}
        aria-invalid={error}
        aria-required={required}
      >
        <option value="" disabled hidden>
          {getTranslation('patientForm.question.select', 'Select')}
        </option>
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </FormSelect>
    </Question>
  );
};

export const SingleChoiceQuestion = props => {
  const { field, label, required, error, helperText, options = [] } = props;
  if (options.length > MAX_LISTED_OPTIONS) return <DropdownQuestion {...props} options={options} />;

  return (
    <Question {...{ label, required, error, helperText }}>
      <ErrorOutline role="radiogroup" data-invalid={error}>
        {options.map(({ value, label: optionLabel }) => (
          <ListOption
            key={value}
            role="radio"
            aria-checked={field.value === value}
            onClick={() => setFieldValue(field, value)}
          >
            <RadioMark />
            {optionLabel}
          </ListOption>
        ))}
      </ErrorOutline>
    </Question>
  );
};

/** Multiple choice answers are stored as a JSON list, as the shared multiselect field does. */
const parseSelectedValues = value => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const MultipleChoiceQuestion = ({
  field,
  label,
  required,
  error,
  helperText,
  options = [],
}) => {
  const selectedValues = parseSelectedValues(field.value);
  const toggle = value => {
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter(selected => selected !== value)
      : [...selectedValues, value];
    setFieldValue(field, nextValues.length > 0 ? JSON.stringify(nextValues) : null);
  };

  return (
    <Question
      {...{ label, required, error, helperText }}
      hint={<TranslatedText stringId="patientForm.question.selectAll" fallback="Select all that apply" />}
    >
      <ErrorOutline role="group" data-invalid={error}>
        {options.map(({ value, label: optionLabel }) => (
          <ListOption
            key={value}
            role="checkbox"
            aria-checked={selectedValues.includes(value)}
            onClick={() => toggle(value)}
          >
            <Tick />
            {optionLabel}
          </ListOption>
        ))}
      </ErrorOutline>
    </Question>
  );
};

/** Yes/no answers are stored as 'true' and 'false', as the shared nullable boolean field does. */
const isYes = value => value === true || value === 'true' || value === 'Yes';
const isNo = value => value === false || value === 'false' || value === 'No';

export const YesNoQuestion = ({ field, label, required, error, helperText }) => (
  <Question {...{ label, required, error, helperText }}>
    <ButtonRow role="radiogroup">
      <PillOption
        role="radio"
        aria-checked={isYes(field.value)}
        onClick={() => setFieldValue(field, 'true')}
      >
        <TranslatedText stringId="general.action.yes" fallback="Yes" />
      </PillOption>
      <PillOption
        role="radio"
        aria-checked={isNo(field.value)}
        onClick={() => setFieldValue(field, 'false')}
      >
        <TranslatedText stringId="general.action.no" fallback="No" />
      </PillOption>
    </ButtonRow>
  </Question>
);

const ConsentOption = styled(ListOption)`
  align-items: flex-start;
  min-height: 0;
  padding: ${formScaled(4)} 0;
  box-shadow: none;
  background: none;
  line-height: 1.45;

  &[aria-checked='true'] {
    background: none;
    box-shadow: none;
    font-weight: normal;
    color: var(--pf-text);
  }
`;

/** A single tick box that is its own question, like a consent. */
export const CheckboxQuestion = ({ field, label, required, error, helperText }) => (
  <>
    <ConsentOption
      role="checkbox"
      aria-checked={isYes(field.value)}
      // Unticking leaves no answer, so a required box has to be ticked
      onClick={() => setFieldValue(field, isYes(field.value) ? null : 'true')}
    >
      <Tick />
      <span>
        {label}
        {required && <RequiredMark aria-hidden="true"> *</RequiredMark>}
      </span>
    </ConsentOption>
    {error && helperText && <FormErrorMessage role="alert">{helperText}</FormErrorMessage>}
  </>
);
