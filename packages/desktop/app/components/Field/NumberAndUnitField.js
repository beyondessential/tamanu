import React, { useState } from 'react';
import styled from 'styled-components';
import { MenuItem } from '@material-ui/core';
import { NumberInput } from './NumberField';
import { TextInput } from './TextField';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const FieldWrapper = styled.div`
  display: flex;
`;

const HiddenInput = styled(TextInput)`
  position: absolute;
  fieldset {
    display: none;
  }
`;

const HiddenField = props => {
  return <HiddenInput {...props} type="hidden" />;
};

// const StyledSelect = styled(Select)`
//   width: 90px;
// `;

const UNIT_OPTIONS = [
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
];

export const NumberAndUnitField = props => {
  const [unit, setUnit] = useState('minutes');
  console.log('props', props);

  const { onChange, value } = props;

  const handleNumberChange = (event, newValue) => {
    console.log('number change', newValue);
  };

  const handleSelectChange = (event, newValue) => {
    console.log('number change', newValue);
  };
  return (
    <OuterLabelFieldWrapper label="Time between onset and death">
      <FieldWrapper>
        <NumberInput name="number" value={10} onChange={handleNumberChange} />
        <TextInput select onChange={handleSelectChange} value={unit}>
          {UNIT_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextInput>
      </FieldWrapper>
      <HiddenField name="hidden" value={value} onChange={onChange} />
    </OuterLabelFieldWrapper>
  );
};
