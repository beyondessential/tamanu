import React from 'react';
import IconButton from '@mui/material/IconButton';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export const InfoButton = props => (
  <IconButton data-testid="infoicon-cnfl" {...props}>
    <InfoOutlined />
  </IconButton>
);
