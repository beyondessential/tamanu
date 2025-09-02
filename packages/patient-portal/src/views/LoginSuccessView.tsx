import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import styled from 'styled-components';

const IconDisplay = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
    background: '#EDFAF3',
    borderRadius: '50%',
    width: 'fit-content',
    display: 'flex',
}));

export const LoginSuccessView = () => {
  return <>
    <IconDisplay>
        <CheckCircleIcon color='success'/>
    </IconDisplay>
  </>;
};