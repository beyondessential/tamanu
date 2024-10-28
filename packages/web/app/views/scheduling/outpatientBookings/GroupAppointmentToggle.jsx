import React from 'react';
import { Box, Button, styled } from '@mui/material';
import { Colors } from '../../../constants';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1px solid ${Colors.primary};
`;

const ToggleButton = styled(Button)`
  border-radius: 50px;
  background-color: ${({ $selected }) => ($selected ? Colors.primary : Colors.white)};
  color: ${({ $selected }) => ($selected ? Colors.white : Colors.primary)};
  padding: 0.25rem 1rem;
  width: 6.563rem;
  box-shadow: none;
  text-transform: none;
  border: none;
  &:active {
    background-color: ${Colors.primary};
  }
  &:hover {
    background-color: ${({ $selected }) => ($selected ? Colors.primary : Colors.white)};
    border: none;
    box-shadow: none;
  }
`;

export const GroupByToggle = ({ value, onChange }) => {
  return (
    <Wrapper>
      <ToggleButton
        $selected={value === APPOINTMENT_GROUP_BY.LOCATION_GROUP}
        onClick={() => onChange(APPOINTMENT_GROUP_BY.LOCATION_GROUP)}
      >
        Area
      </ToggleButton>
      <ToggleButton
        $selected={value === APPOINTMENT_GROUP_BY.CLINICIAN}
        onClick={() => onChange(APPOINTMENT_GROUP_BY.CLINICIAN)}
      >
        Clinicians
      </ToggleButton>
    </Wrapper>
  );
};
