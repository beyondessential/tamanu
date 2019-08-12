import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from './DateDisplay';

const HistoryRow = styled.div`
  display: grid;
  min-height: 3rem;
  grid-template-columns: 6rem 1rem 6rem auto;
  align-items: stretch;
  grid-column-gap: 1rem;
  background: #eee;
`;

const HistoryCell = styled.div`
  display: block;
  text-align: center;
`;

const HistoryItem = ({ item }) => (
  <HistoryRow>
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
