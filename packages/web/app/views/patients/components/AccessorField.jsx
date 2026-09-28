import React from 'react';
import styled from 'styled-components';

import { LAB_TEST_RESULT_TYPES } from '@tamanu/constants';
import { parseLabTestResult } from '@tamanu/utils/labTests';

import { Field, NumberField, ReadOnlyTextField, TextField } from '../../../components/Field';
import { Colors } from '../../../constants';
import { TranslatedOptionSelectField } from '../../../components/Translation/TranslatedOptions';

const StyledField = styled(Field)`
  .Mui-disabled {
    background: ${Colors.background2};
    .MuiOutlinedInput-notchedOutline {
      border-color: #dedede;
    }
  }
`;

// A detection-limit result (e.g. "< 0.3") comes in from SENAITE and can't be represented in a
// numeric input, so it's shown read-only rather than silently blanked out.
const NumericResultField = ({ field, ...props }) => {
  const { comparator } = parseLabTestResult(field.value);
  const ResultField = comparator ? ReadOnlyTextField : NumberField;
  return <ResultField field={field} {...props} />;
};

function getResultComponent(resultType, options) {
  if (options && options.length) return TranslatedOptionSelectField;
  if (resultType === LAB_TEST_RESULT_TYPES.FREE_TEXT) return TextField;
  return NumericResultField;
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
    name={`labTests.${id}.${name}`}
    data-testid="styledfield-h653"
  />
);

export const LabResultAccessorField = ({ resultType, options, labTestTypeId, ...props }) => (
  <AccessorField
    component={getResultComponent(resultType, options)}
    options={getResultOptions(options)}
    referenceDataId={labTestTypeId}
    referenceDataCategory='labTestType'
    {...props}
  />
);
