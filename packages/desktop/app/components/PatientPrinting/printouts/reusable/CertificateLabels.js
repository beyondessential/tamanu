import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { LocalisedText } from '../../../LocalisedText';

// TODO: can we style these normally instead of passing them around?
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

export const LocalisedCertificateLabel = ({
  name,
  children,
  margin = '20px',
  size = '12px',
  className,
  path = `fields.${name}.longLabel`,
}) => (
  <Text $margin={margin} $size={size} className={className}>
    <strong>
      <LocalisedText path={path} />:{' '}
    </strong>
    {children}
  </Text>
);
