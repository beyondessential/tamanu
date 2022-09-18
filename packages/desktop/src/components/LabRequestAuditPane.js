import React from 'react';

import { getStatus } from '../utils/lab';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const COLUMNS = [
  {
    key: 'createdAt',
    title: 'Date',
    accessor: ({ createdAt }) => <DateDisplay date={createdAt} />,
  },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'updatedByDisplayName', title: 'Officer' },
];

export const LabRequestAuditPane = ({ labRequest }) => (
  <DataFetchingTable columns={COLUMNS} endpoint={`labRequestLog/labRequest/${labRequest.id}`} />
);
