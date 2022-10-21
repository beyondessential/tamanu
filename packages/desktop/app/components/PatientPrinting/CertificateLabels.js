import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { LocalisedText } from '../LocalisedText';

const Text = styled(Typography)`
  font-size: ${props => props.$size};
  margin-bottom: ${props => props.$margin};
`;

export const CertificateLabel = ({ name, children, margin = '20px', size = '12px' }) => (
  <Text $margin={margin} $size={size}>
    <strong>{name}: </strong>
    {children}
  </Text>
);

export const LocalisedCertificateLabel = ({ name, children, margin = '20px', size = '12px' }) => (
  <Text $margin={margin} $size={size}>
    <strong>
      <LocalisedText path={`fields.${name}.longLabel`} />:{' '}
    </strong>
    {children}
  </Text>
);
