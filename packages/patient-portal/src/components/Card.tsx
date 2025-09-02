import React from 'react';
import { styled, Paper } from '@mui/material';

export const Card = styled(Paper)`
  margin: 100px auto;
  display: block;
  padding: 22px;
  min-width: 300px;
  width: ${({ width }: { width?: string }) => width || '520px'};
  max-width: 100%;
  text-align: center;
  border-radius: 10px;
  box-shadow: none;
  border: none;
`;
