import React from 'react';
import styled from 'styled-components';
import { Table } from './Table';

import { DateDisplay } from './DateDisplay';

const getDate = ({ endDate }) => <DateDisplay date={endDate} />;
const getType = ({ visitType }) => <p>{visitType}</p>;
const getDescription = ({ reasonForVisit }) => <p>{reasonForVisit}</p>;

const columns = [
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'description', title: 'Description', accessor: getDescription },
];

export const PatientHistory = ({ items, onItemClick }) => {
  return <Table columns={columns} data={items} onRowClick={row => onItemClick(row)} />;
};
