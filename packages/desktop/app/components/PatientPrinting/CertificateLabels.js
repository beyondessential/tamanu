import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { LocalisedText } from '../LocalisedText';

const Text = styled(Typography)`
  font-size: 14px;
  margin-bottom: 20px;
`;

export const CertificateLabel = ({ name, children }) => (
  <Text>
    <strong>{name}: </strong>
    {children}
  </Text>
);

export const LocalisedCertificateLabel = ({ name, children }) => (
  <Text>
    <strong>
      <LocalisedText path={`fields.${name}.longLabel`} />:{' '}
    </strong>
    {children}
  </Text>
);
