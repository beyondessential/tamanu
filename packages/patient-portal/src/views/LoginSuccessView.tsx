import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import styled from 'styled-components';

const CheckIcon = styled(CheckCircleIcon)(({ theme }) => ({
    padding: theme.spacing(2),
    background: '#EDFAF3',
    borderRadius: '50%',
    color: theme.colors.green
}));

export const LoginSuccessView = () => {
  return <>
    <CheckIcon />
  </>;
};