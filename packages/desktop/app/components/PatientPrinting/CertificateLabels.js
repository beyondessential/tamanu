import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { LocalisedText } from '../LocalisedText';

const Text = styled(Typography)`
  font-size: 12px;
  margin-bottom: ${p => p.margin};
`;

export const CertificateLabel = ({ name, children, margin = '20px' }) => (
  <Text margin={margin}>
    <strong>{name}: </strong>
    {children}
  </Text>
);

export const LocalisedCertificateLabel = ({ name, children, margin = '20px' }) => (
  <Text margin={margin}>
    <strong>
      <LocalisedText path={`fields.${name}.longLabel`} />:{' '}
    </strong>
    {children}
  </Text>
);
