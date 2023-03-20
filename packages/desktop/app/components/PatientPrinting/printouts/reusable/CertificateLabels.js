import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { LocalisedText } from '../../../LocalisedText';

const Text = styled(Typography)`
  font-size: ${props => props.$size};
  margin-bottom: ${props => props.$margin};
`;

export const CertificateLabel = ({ name, children, margin = '20px', size = '12px', className }) => (
  <Text $margin={margin} $size={size} className={className}>
    <strong>{name}: </strong>
    {children}
  </Text>
);

const sanitiseLength = length => (length === 'short' ? 'shortLabel' : 'longLabel');

export const LocalisedCertificateLabel = ({
  name,
  children,
  margin = '20px',
  size = '12px',
  className,
  length = 'long',
}) => (
  <Text $margin={margin} $size={size} className={className}>
    <strong>
      <LocalisedText path={`fields.${name}.${sanitiseLength(length)}`} />:{' '}
    </strong>
    {children}
  </Text>
);
