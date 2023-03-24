import React from 'react';
import { Typography } from '@material-ui/core';
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
