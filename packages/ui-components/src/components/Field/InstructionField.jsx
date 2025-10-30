import React from 'react';
import { Box, Typography } from '@mui/material';

export const InstructionField = ({ label, helperText }) => (
  <Box sx={{ mb: 1 }}>
    <Typography>
      {label} {helperText}
    </Typography>
  </Box>
);
