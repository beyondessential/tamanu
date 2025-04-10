import React from 'react';
import styled from 'styled-components';
import { SwitchInput } from '../../../components/Field/SwitchField';

const SwitchInputContainer = styled.div`
  margin: 0.6875rem 1.25rem;
`;

const StyledSwitchInput = styled(SwitchInput)`
  .MuiFormControlLabel-label {
    font-size: 0.875rem;
  }
`;

export const ReferenceDataSwitchInput = props => (
  <SwitchInputContainer>
    <StyledSwitchInput {...props} />
  </SwitchInputContainer>
);

export const ReferenceDataSwitchField = ({ field, ...props }) => (
  <ReferenceDataSwitchInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
  />
);
