import React from 'react';
import styled from 'styled-components';

export const DetailTable = styled.div`
  display: grid;

  grid-column-gap: 0.7rem;
  grid-row-gap: 0.7rem;

  grid-template-columns: ${p => p.width || '8rem'} auto;

  align-content: start;
`;

const DetailKey = styled.div`
  font-weight: bold;
  border-bottom: 1px solid #ccc;
`;

const DetailValue = styled.div``;

const FullWidthDetailValue = styled.div`
  grid-column: span 2;
`;

export const DetailRow = ({ label, value, children }) => (
  <React.Fragment>
    <DetailKey>{label}</DetailKey>
    <DetailValue>{value || children}</DetailValue>
  </React.Fragment>
);

export const FullWidthDetailRow = ({ label, value, children }) => (
  <React.Fragment>
    <DetailKey>{label}</DetailKey>
    <div />
    <FullWidthDetailValue>{value || children}</FullWidthDetailValue>
  </React.Fragment>
);
