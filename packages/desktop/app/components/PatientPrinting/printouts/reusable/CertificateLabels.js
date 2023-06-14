import React from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import { LocalisedText } from '../../../LocalisedText';

export const CertificateLabel = ({ name, children, className }) => (
  <Typography className={className}>
    <strong>{name}: </strong>
    {children}
  </Typography>
);

export const LocalisedCertificateLabel = ({
  name,
  children,
  className,
  path = `fields.${name}.longLabel`,
}) => (
  <Typography className={className}>
    <strong>
      <LocalisedText path={path} />:{' '}
    </strong>
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
