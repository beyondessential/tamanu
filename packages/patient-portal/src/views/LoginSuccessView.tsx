import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import styled from 'styled-components';

const IconDisplay = styled('div')(({ theme }) => ({
    padding: theme.spacing(1),
    background: '#EDFAF3',
    borderRadius: '50%',
    width: 'fit-content',
    display: 'flex',
    margin: '0 auto',
}));

export const LoginSuccessView = () => {
  return <>
    <IconDisplay>
        <CheckCircleIcon color='success'/>
    </IconDisplay>
  </>;
};