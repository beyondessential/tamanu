import React from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';

// TODO: disabled logic
const CellContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${$enabled => ($enabled ? 'white' : 'initial')};
  width: 300px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const TimeCell = styled.div`
  border: 1px solid ${Colors.outline};
  height: 30px;
  width: 125px;
  border-radius: 50px;
`;

export const BookingTimeField = () => {
  return (
    // TODO: why isnt tooltip working with field wrapper
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
        <TimeCell>8:00am - 9:00am</TimeCell>
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
