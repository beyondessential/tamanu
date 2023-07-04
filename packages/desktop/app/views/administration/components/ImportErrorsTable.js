import React from 'react';

import styled from 'styled-components';

import { Table } from '../../../components/Table';

// an error object looks like this
// {
//   sheet: 'drugs',
//   row: 13,
//   recordType: 'referenceData',
//   data: { code: '123', name: 'Test' },
//   errors: ['id is a required field'],
// },

const ErrorText = styled.span`
  color: red;
`;

const COLUMNS = [
  { key: 'sheet', title: 'Sheet', width: 1 },
  { key: 'row', title: 'Row' },
  {
    key: 'error',
    title: 'Error',
    accessor: data => <ErrorText>{data.errors.join(', ')}</ErrorText>,
  },
];

export const ImportErrorsTable = ({ errors }) => (
  <Table rowIdKey="row" columns={COLUMNS} noDataMessage="All good!" data={errors} />
);
