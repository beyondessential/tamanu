import React, { memo } from 'react';
import styled from 'styled-components';
import { startCase } from 'lodash';
import { TextField } from '@tamanu/ui-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { Field, SelectField, AutocompleteField } from '../../../../components/Field';
import { NumberField } from '../../../../components/Field/NumberField';
import { CheckField } from '../../../../components/Field/CheckField';
import { useSuggester } from '../../../../api/suggesters';

const CheckFieldWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  padding-top: 20px;
`;

const VISIBILITY_STATUS_OPTIONS = Object.values(VISIBILITY_STATUSES).map(value => ({
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
  const suggester = useSuggester(col.suggesterEndpoint);
  console.log('suggesterrrr', suggester);
  return (
    <Field
      name={col.key}
      label={col.key}
      component={AutocompleteField}
      suggester={suggester}
      required={!col.allowNull}
      disabled={disabled}
      data-testid={`field-form-${col.key}`}
    />
  );
});

export const FormField = memo(({ col, isEditMode }) => {
  const disabled = isEditMode && (col.readOnly || col.readOnlyOnEdit);

  if (col.suggesterEndpoint) {
    return <SuggesterFormField col={col} disabled={disabled} />;
  }

  if (col.key === 'visibilityStatus') {
    return (
      <Field
        name={col.key}
        label={col.key}
        component={SelectField}
        options={VISIBILITY_STATUS_OPTIONS}
        required={!col.allowNull}
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
      required={!col.allowNull}
      disabled={disabled}
      data-testid={`field-form-${col.key}`}
    />
  );

  if (col.type === 'BOOLEAN') {
    return <CheckFieldWrapper>{field}</CheckFieldWrapper>;
  }

  return field;
});
