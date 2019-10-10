import React from 'react';
import { Table } from './Table';

import { DateDisplay } from './DateDisplay';
import { VISIT_OPTIONS_BY_VALUE } from '../constants';

const getDate = ({ startDate }) => <DateDisplay date={startDate} />;
const getType = ({ visitType }) => VISIT_OPTIONS_BY_VALUE[visitType].label;
const getDescription = ({ reasonForVisit }) => <div>{reasonForVisit}</div>;

const columns = [
  { key: 'date', title: 'Start date', accessor: getDate },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'description', title: 'Description', accessor: getDescription },
];

export const PatientHistory = ({ items, onItemClick }) => {
  return <Table columns={columns} data={items} onRowClick={row => onItemClick(row)} />;
};
