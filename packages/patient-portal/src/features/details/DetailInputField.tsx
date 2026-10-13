import React, { useId } from 'react';
import styled from 'styled-components';
import { TITLE_LABELS } from '@tamanu/constants';
import { FormErrorMessage, FormInput, FormSelect, useTranslation } from '@tamanu/ui-components';

import { useReferenceDataOptionsQuery } from '@api/queries/useReferenceDataOptionsQuery';
import type { DetailField, DetailInput } from './detailFields';

const FieldFrame = styled.div`
  padding-top: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 500;
`;

const RequiredMark = styled.span`
  color: var(--pf-alert);
`;

/** Keyboard and autofill hints, so phones offer the right keys and saved details. */
const TYPED_INPUT_PROPS: Record<string, React.InputHTMLAttributes<HTMLInputElement>> = {
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
  email: { type: 'email', inputMode: 'email', autoComplete: 'email', autoCapitalize: 'off' },
  text: { type: 'text', autoCapitalize: 'words' },
};

const AUTOCOMPLETE_BY_NAME: Record<string, string> = {
  streetVillage: 'address-line1',
  cityTown: 'address-level2',
};

interface ControlProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  invalid: boolean;
  describedBy?: string;
}

const ChoiceControl = ({
  options,
  ...props
}: ControlProps & { options: { value: string; label: string }[] }) => {
  const { getTranslation } = useTranslation();
  return (
    <FormSelect
      id={props.id}
      value={props.value}
      onChange={event => props.onChange(event.target.value)}
      aria-invalid={props.invalid}
      aria-required={props.required}
      aria-describedby={props.describedBy}
    >
      <option value="">{getTranslation('patientPortal.details.none', 'None')}</option>
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </FormSelect>
  );
};

const ReferenceDataControl = ({ type, ...props }: ControlProps & { type: string }) => {
  const { data: options = [] } = useReferenceDataOptionsQuery(type);
  return (
    <ChoiceControl
      {...props}
      options={options.map(({ id, name }) => ({ value: id, label: name }))}
    />
  );
};

const DetailControl = ({
  input,
  name,
  ...props
}: ControlProps & { input: DetailInput; name: string }) => {
  const { getEnumTranslation } = useTranslation();
  if (input.kind === 'title') {
    const options = Object.keys(TITLE_LABELS).map(value => ({
      value,
      label: getEnumTranslation(TITLE_LABELS, value),
    }));
    return <ChoiceControl {...props} options={options} />;
  }
  if (input.kind === 'referenceData') {
    return <ReferenceDataControl {...props} type={input.type} />;
  }
  return (
    <FormInput
      id={props.id}
      value={props.value}
      onChange={event => props.onChange(event.target.value)}
      aria-invalid={props.invalid}
      aria-required={props.required}
      aria-describedby={props.describedBy}
      maxLength={255}
      {...TYPED_INPUT_PROPS[input.kind]}
      {...(AUTOCOMPLETE_BY_NAME[name] && { autoComplete: AUTOCOMPLETE_BY_NAME[name] })}
    />
  );
};

/** One editable detail: its label, its control and any problem with what was entered. */
export const DetailInputField = ({
  field,
  value,
  onChange,
  required,
  error,
}: {
  field: DetailField;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  error?: string;
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <FieldFrame>
      <Label htmlFor={id}>
        {field.label}
        {required && <RequiredMark aria-hidden> *</RequiredMark>}
      </Label>
      <DetailControl
        input={field.input!}
        name={field.name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
      />
      {error && <FormErrorMessage id={errorId}>{error}</FormErrorMessage>}
    </FieldFrame>
  );
};
