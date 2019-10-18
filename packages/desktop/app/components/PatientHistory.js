import React from 'react';
import { Table } from './Table';

import { DateDisplay } from './DateDisplay';
import { VISIT_OPTIONS_BY_VALUE } from '../constants';

const getDate = ({ startDate }) => <DateDisplay date={startDate} />;
const getType = ({ visitType }) => VISIT_OPTIONS_BY_VALUE[visitType].label;
const getDescription = ({ reasonForVisit }) => <div>{reasonForVisit}</div>;
const getEndDate = ({ endDate }) => (endDate ? <DateDisplay date={endDate} /> : 'Current');

const columns = [
  { key: 'startDate', title: 'Start date', accessor: getDate },
  { key: 'endDate', title: 'End date', accessor: getEndDate },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'description', title: 'Description', accessor: getDescription },
];

export const PatientHistory = ({ items, onItemClick }) => {
  const sortedItems = items.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  return <Table columns={columns} data={sortedItems} onRowClick={row => onItemClick(row)} />;
};
