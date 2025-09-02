import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import styled from 'styled-components';
import { Button } from '@tamanu/ui-components';
import { Typography } from '@mui/material';

const IconDisplay = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  background: '#EDFAF3',
  borderRadius: '50%',
  width: 'fit-content',
  display: 'flex',
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

export const LoginSuccessView = () => {
  return (
    <>
      <IconDisplay>
        <CheckCircleIcon color="success" />
      </IconDisplay>
        <Typography mb={2} variant="h2">Account successfully created!</Typography>
        <Typography variant="body1" mb={3} color="text.secondary">Continue to log in to access the Patient Portal.</Typography>
        <Button type="submit" fullWidth variant="contained">Continue to log in</Button>
    </>
  );
};
