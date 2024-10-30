import React from 'react';
import { Box, styled } from '@mui/material';
import { Colors } from '../../../constants';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

const Wrapper = styled(Box)`
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 2.2rem;
  position: relative;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1px solid ${Colors.primary};
  margin-inline-end: 1rem;
  user-select: none;
`;

const ToggleButton = styled('div')`
  border-radius: 50px;
  color: ${({ $selected }) => ($selected ? Colors.white : Colors.primary)};
  width: 6.65rem;
  position: relative;
  text-align: center;
  box-shadow: none;
  text-transform: none;
  border: none;
  transition: color 0.25s;
`;

const AnimatedBackground = styled('div')`
  position: absolute;
  width: 6.6rem;
  left: 0.2rem;
  height: 1.8rem;
  border-radius: 50px;
  background-color: ${Colors.primary};
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.04, 1.15);
  transform: ${({ $selected }) => ($selected ? 'translateX(6.563rem)' : 'translateX(0)')};
`;

export const GroupByAppointmentToggle = ({ value, onChange }) => {
  const handleChange = () => {
    onChange(
      value === APPOINTMENT_GROUP_BY.LOCATION_GROUP
        ? APPOINTMENT_GROUP_BY.CLINICIAN
        : APPOINTMENT_GROUP_BY.LOCATION_GROUP,
    );
  };
  return (
    <Wrapper onClick={handleChange}>
      {/* TODO this is weird naming */}
      <AnimatedBackground $selected={value === APPOINTMENT_GROUP_BY.CLINICIAN} />
      <ToggleButton $selected={value === APPOINTMENT_GROUP_BY.LOCATION_GROUP}>Area</ToggleButton>
      <ToggleButton $selected={value === APPOINTMENT_GROUP_BY.CLINICIAN}>Clinicians</ToggleButton>
    </Wrapper>
  );
};
