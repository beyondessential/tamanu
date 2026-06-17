import React, { memo } from 'react';
import styled from 'styled-components';
import { startCase } from 'lodash-es';
import { TextField } from '@tamanu/ui-components';
import { NONPATIENT_VISIBILITY_STATUS_VALUES } from '@tamanu/constants/importable';
import {
  Field,
  SelectField,
  AutocompleteField,
  MultiAutocompleteField,
} from '../../../../components/Field';
import { NumberField } from '../../../../components/Field/NumberField';
import { CheckField } from '../../../../components/Field/CheckField';
import { useSuggester } from '../../../../api/suggesters';
import { REQUIRED_FIELDS, SUGGESTER_OPTIONS } from './constants';

const CheckFieldWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  padding-top: 20px;
`;

const VISIBILITY_STATUS_OPTIONS = NONPATIENT_VISIBILITY_STATUS_VALUES.map(value => ({
  value,
  label: startCase(value),
}));

const getFieldComponent = columnType => {
  switch (columnType) {
    case 'BOOLEAN':
      return CheckField;
    case 'INTEGER':
    case 'FLOAT':
    case 'DOUBLE':
    case 'DECIMAL':
    case 'REAL':
      return NumberField;
    default:
      return TextField;
  }
};

const SuggesterFormField = memo(({ col, disabled }) => {
  const suggester = useSuggester(col.suggesterEndpoint, SUGGESTER_OPTIONS);
  return (
    <Field
      name={col.key}
      label={col.key}
      component={AutocompleteField}
      suggester={suggester}
      required={REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)}
      disabled={disabled}
      data-testid={`field-form-${col.key}`}
    />
  );
});

const MultiSuggesterFormField = memo(({ col, disabled }) => {
  const suggester = useSuggester(col.suggesterEndpoint, SUGGESTER_OPTIONS);
  return (
    <Field
      name={col.key}
      label={col.key}
      component={MultiAutocompleteField}
      suggester={suggester}
      required={REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)}
      disabled={disabled}
      data-testid={`field-form-${col.key}`}
      style={{ gridColumn: 'span 2' }}
    />
  );
});

const AvailableFacilitiesFormField = memo(({ disabled }) => {
  const suggester = useSuggester('facility', { ...SUGGESTER_OPTIONS, baseQueryParameters: { ...SUGGESTER_OPTIONS.baseQueryParameters, noLimit: true } });
  return (
    <Field
      name="availableFacilities"
      label="availableFacilities"
      component={MultiAutocompleteField}
      suggester={suggester}
      allowSelectAll
      disabled={disabled}
      data-testid="field-form-availableFacilities"
    />
  );
});

export const FormField = memo(({ col, isEditMode }) => {
  const disabled = isEditMode && (col.readOnly || col.readOnlyOnEdit);

  if (col.key === 'availableFacilities') {
    return <AvailableFacilitiesFormField disabled={disabled} />;
  }

  if (col.suggesterEndpoint && col.multiSelect) {
    return <MultiSuggesterFormField col={col} disabled={disabled} />;
  }

  if (col.suggesterEndpoint) {
    return <SuggesterFormField col={col} disabled={disabled} />;
  }

  if (col.enumValues) {
    const options = col.enumValues.map(value => ({ value, label: value }));
    return (
      <Field
        name={col.key}
        label={col.key}
        component={SelectField}
        options={options}
        required={REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)}
        disabled={disabled}
        data-testid={`field-form-${col.key}`}
      />
    );
  }

  if (col.key === 'visibilityStatus') {
    return (
      <Field
        name={col.key}
        label={col.key}
        component={SelectField}
        options={VISIBILITY_STATUS_OPTIONS}
        required={REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)}
        disabled={disabled}
        data-testid={`field-form-${col.key}`}
      />
    );
  }

  const field = (
    <Field
      name={col.key}
      label={col.key}
      component={getFieldComponent(col.type)}
      required={REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)}
      disabled={disabled}
      data-testid={`field-form-${col.key}`}
    />
  );

  if (col.type === 'BOOLEAN') {
    return <CheckFieldWrapper>{field}</CheckFieldWrapper>;
  }

  return field;
});
