import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import React from 'react';
import styled from 'styled-components';

const Root = styled.div`
  margin-block: 0.5em;
`;

export const InstructionField = ({ label, helperText, ...props }) => (
  <Root {...props}>
    {label && (
      <Typography component="h2" variant="body1">
        {label}
      </Typography>
    )}
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </Root>
);
