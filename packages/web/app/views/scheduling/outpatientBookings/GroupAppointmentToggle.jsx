import React from 'react';
import { Box, Button, styled } from '@mui/material';
import { Colors } from '../../../constants';

const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1px solid ${Colors.primary};
  margin-right: auto;
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
        $selected={value === 'area'}
        onClick={() => onChange('area')}
        variant={value === 'area' ? 'contained' : 'outlined'}
      >
        Area
      </ToggleButton>
      <ToggleButton
        $selected={value === 'clinicians'}
        onClick={() => onChange('clinicians')}
        variant={value === 'clinicians' ? 'contained' : 'outlined'}
      >
        Clinicians
      </ToggleButton>
    </Wrapper>
  );
};
