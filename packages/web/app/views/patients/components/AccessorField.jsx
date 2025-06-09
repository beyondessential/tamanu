import React from 'react';
import { LAB_TEST_RESULT_TYPES } from '@tamanu/constants';
import styled from 'styled-components';
import { Field, NumberField, TextField } from '../../../components/Field';
import { Colors } from '../../../constants';
import { TranslatedOptionSelectField } from '../../../components/Translation/TranslatedOptionSelect';

const StyledField = styled(Field)`
  .Mui-disabled {
    background: ${Colors.softOutline};
    .MuiOutlinedInput-notchedOutline {
      border-color: #dedede;
    }
  }
`;

function getResultComponent(resultType, options) {
  if (options && options.length) return TranslatedOptionSelectField;
  if (resultType === LAB_TEST_RESULT_TYPES.FREE_TEXT) return TextField;
  return NumberField;
}

function getResultOptions(options) {
  if (!options) return [];
  const trimmed = options.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\s*,\s*/)
    .filter((x) => x)
}

export const AccessorField = ({ id, name, tabIndex, ...props }) => (
  <StyledField
    {...props}
    inputProps={{ tabIndex }}
    name={`${id}.${name}`}
    data-testid="styledfield-h653"
  />
);

export const LabResultAccessorField = ({ resultType, options, ...props }) => (
  <AccessorField
    component={getResultComponent(resultType, options)}
    options={getResultOptions(options)}
    referenceDataId={props.id}
    referenceDataCategory='labTestType'
    {...props}
  />
);
