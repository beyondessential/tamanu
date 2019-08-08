import React from 'react';
import styled from 'styled-components';

export const DetailTable = styled.div`
  display: grid;

  grid-column-gap: 0.7rem;
  grid-row-gap: 0.7rem;

  grid-template-columns: 8rem auto;

  align-content: start;
`;

const DetailTableKey = styled.div`
  font-weight: bold;
  border-bottom: 1px solid #ccc;
`;

const DetailTableValue = styled.div``;

export const DetailRow = ({ label, value, children }) => (
  <React.Fragment>
    <DetailTableKey>{label}</DetailTableKey>
    <DetailTableValue>{value || children}</DetailTableValue>
  </React.Fragment>
);
