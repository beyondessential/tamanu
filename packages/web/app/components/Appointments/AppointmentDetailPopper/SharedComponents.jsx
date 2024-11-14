import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

export const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

export const Title = styled('span')`
  font-weight: 500;
  font-size: 0.875rem;
`;

export const Label = styled('span')`
  font-weight: 500;
  color: ${props => props.color || 'inherit'};
`;

export const InlineDetailsDisplay = ({ label, value }) => (
  <span>
    <Label>{label}: </Label> {value ?? '—'}
  </span>
);

export const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? <>&mdash;</>}</span>
  </FlexCol>
);
