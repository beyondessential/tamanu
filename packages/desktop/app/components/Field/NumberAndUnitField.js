import React from 'react';
import styled from 'styled-components';
import { NumberInput } from './NumberField';
import { SelectInput } from './SelectField';
import { TextInput, StyledTextField } from './TextField';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
`;

const HiddenInput = styled(TextInput)`
  position: absolute;
  fieldset {
    display: none;
  }
`;

const FieldWrapper = styled(OuterLabelFieldWrapper)`
  position: relative;
`;

const HiddenField = props => {
  return <HiddenInput {...props} type="hidden" />;
};

const StyledSelectInput = styled(SelectInput)`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
`;

const UNIT_OPTIONS = [
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
];

export const NumberAndUnitField = props => {
  console.log('props', props);

  const { onChange, value } = props;

  const handleNumberChange = (event, newValue) => {
    console.log('number change', newValue);
  };

  const handleSelectChange = (event, newValue) => {
    console.log('number change', newValue);
  };
  return (
    <Container>
      <FieldWrapper label="Time between onset and death">
        <NumberInput name="number" value={10} onChange={handleNumberChange} />
        <StyledSelectInput
          name="unit"
          value="minutes"
          options={UNIT_OPTIONS}
          onChange={handleSelectChange}
        />
      </FieldWrapper>

      <HiddenField name="hidden" value={value} onChange={onChange} />
    </Container>
  );
};
