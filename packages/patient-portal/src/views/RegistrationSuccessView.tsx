import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';

import { Button } from '@tamanu/ui-components';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Card } from '../components/Card';
import { useNavigate } from 'react-router';

const IconDisplay = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  background: '#EDFAF3',
  borderRadius: '50%',
  width: 'fit-content',
  display: 'flex',
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

export const RegistrationSuccessView = () => {
  const navigate = useNavigate();
  return (
    <Card width="425px">
      <IconDisplay>
        <CheckCircleIcon color="success" />
      </IconDisplay>
      <Typography mb={2} variant="h2">
        Account successfully created!
      </Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        Continue to log in to access the Patient Portal.
      </Typography>
      <Button onClick={() => navigate('/login')} type="submit" fullWidth variant="contained">
        Continue to log in
      </Button>
    </Card>
  );
};
