import React from 'react';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const BaseCircularProgress = (props: React.ComponentProps<typeof CircularProgress>) => (
  <CircularProgress size={24} {...props} />
);

export const StyledCircularProgress = styled(BaseCircularProgress)({
  margin: '0 auto',
  display: 'block',
});
