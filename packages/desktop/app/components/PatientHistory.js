import React from 'react';
import { Table } from './Table';

import { DateDisplay } from './DateDisplay';

const getDate = ({ endDate }) => <DateDisplay date={endDate} />;
const getType = ({ visitType }) => <div>{visitType}</div>;
const getDescription = ({ reasonForVisit }) => <div>{reasonForVisit}</div>;

const columns = [
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'description', title: 'Description', accessor: getDescription },
];

export const PatientHistory = ({ items, onItemClick }) => {
  return <Table columns={columns} data={items} onRowClick={row => onItemClick(row)} />;
};
