import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from './DateDisplay';

const HistoryRow = styled.div`
  display: grid;
  grid-template-columns: 5rem 1rem 5rem auto;
  align-items: stretch;
  grid-column-gap: 0.5rem;
  background: ${ p => p.highlight ? "#ffe" : "#eee" };
  padding: 0.8rem 0rem;

  cursor: pointer;
  &:hover {
    background: #fafafa;
  }
`;

const HistoryCell = styled.div`
  display: block;
  text-align: center;
`;

const HistoryItem = ({ item }) => (
  <HistoryRow highlight={!item.endDate}>
    <HistoryCell><DateDisplay date={item.startDate} /></HistoryCell>
    <div>&mdash;</div>
    <HistoryCell>{ item.endDate ? <DateDisplay date={item.endDate} /> : "CURRENT" }</HistoryCell>
    <div>{ item.visitType }</div>
  </HistoryRow>
);

export const PatientHistory = ({ items }) => (
  <div>
    { items.map(v => <HistoryItem item={v} key={v._id} />) }
  </div>
);
