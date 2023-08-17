import React from 'react';
import { capitalize } from 'lodash';
import { LAB_TEST_RESULT_TYPES } from '@tamanu/constants';
import styled from 'styled-components';
import { NumberField, SelectField, TextField, Field } from '../../../components/Field';
import { Colors } from '../../../constants';

const StyledField = styled(Field)`
  .Mui-disabled {
    background: ${Colors.softOutline};
    .MuiOutlinedInput-notchedOutline {
      border-color: #dedede;
    }
  }
`;

function getResultComponent(resultType, options) {
  if (options && options.length) return SelectField;
  if (resultType === LAB_TEST_RESULT_TYPES.FREE_TEXT) return TextField;
  return NumberField;
}

function getResultOptions(options) {
  if (!options) return [];
  const trimmed = options.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\s*,\s*/)
    .filter(x => x)
    .map(value => ({
      value,
      label: capitalize(value),
    }));
}

export const AccessorField = ({ id, name, tabIndex, ...props }) => (
  <StyledField {...props} inputProps={{ tabIndex }} name={`${id}.${name}`} />
);

export const LabResultAccessorField = ({ resultType, options, ...props }) => (
  <AccessorField
    component={getResultComponent(resultType, options)}
    options={getResultOptions(options)}
    {...props}
  />
);
