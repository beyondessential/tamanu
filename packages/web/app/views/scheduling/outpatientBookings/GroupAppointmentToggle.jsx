import React from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { Colors } from '../../../constants';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';
import { TranslatedText } from '../../../components';

const Wrapper = styled(Box)`
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 2.4rem;
  position: relative;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1px solid ${Colors.primary};
  margin-inline-end: 1rem;
  user-select: none;
`;

const ToggleButton = styled('button')`
  cursor: pointer;
  position: relative;
  appearance: none;
  color: ${Colors.primary};
  border: none;
  background: none;
  width: 6.65rem;
  text-align: center;
  font-weight: 500;
  font-family: inherit;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  &[aria-checked='true'] {
    color: ${Colors.white};
  }
`;
ToggleButton.defaultProps = { role: 'radio' };

const AnimatedBackground = styled('div')`
  position: absolute;
  width: 6.6rem;
  left: 0.2rem;
  height: 2rem;
  border-radius: 50px;
  background-color: ${Colors.primary};
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  transform: ${({ $toggled }) => ($toggled ? 'translateX(6.563rem)' : 'translateX(0)')};
`;
AnimatedBackground.defaultProps = { 'aria-hidden': true };

export const GroupByAppointmentToggle = ({ value, onChange }) => {
  const handleChange = () => {
    onChange(
      value === APPOINTMENT_GROUP_BY.LOCATION_GROUP
        ? APPOINTMENT_GROUP_BY.CLINICIAN
        : APPOINTMENT_GROUP_BY.LOCATION_GROUP,
    );
  };
  return (
    <Wrapper onClick={handleChange} role="radiogroup">
      <AnimatedBackground $toggled={value === APPOINTMENT_GROUP_BY.CLINICIAN} />
      <ToggleButton aria-checked={value === APPOINTMENT_GROUP_BY.LOCATION_GROUP}>
        <TranslatedText stringId="outpatientAppointments.groupByToggle.area" fallback="Area" />
      </ToggleButton>
      <ToggleButton aria-checked={value === APPOINTMENT_GROUP_BY.CLINICIAN}>
        <TranslatedText
          stringId="outpatientAppointments.groupByToggle.clinicians"
          fallback="Clinicians"
        />
      </ToggleButton>
    </Wrapper>
  );
};
