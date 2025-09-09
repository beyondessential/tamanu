import React from 'react';
import { Typography } from '@mui/material';
import styled from 'styled-components';

export const CertificateLabel = ({ name, children, className }) => (
  <Typography className={className} data-testid="typography-p24r">
    <strong>{name}: </strong>
    {children}
  </Typography>
);

export const LocalisedCertificateLabel = ({ children, className, label }) => (
  <Typography className={className} data-testid="typography-pdom">
    <strong>{label}: </strong>
    {children}
  </Typography>
);

export const DisplayValue = styled(CertificateLabel)`
  font-size: 10px;
  line-height: 12px;
  margin-bottom: 9px;
  margin-bottom: 5px;
`;

export const LocalisedDisplayValue = styled(LocalisedCertificateLabel)`
  font-size: 10px;
  line-height: 12px;
  margin-bottom: 5px;
`;
