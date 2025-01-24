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

export const ReferenceDataSwitch = ({ value, onChange, label }) => (
  <SwitchInputContainer>
    <StyledSwitchInput label={label} value={value} onChange={onChange} />
  </SwitchInputContainer>
);
