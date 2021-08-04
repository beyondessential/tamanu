import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { StatusDisplay } from './LabRequestsTable';

const COLUMNS = [
  {
    key: 'createdAt',
    title: 'Date',
    accessor: ({ createdAt }) => <DateDisplay date={createdAt} />,
  },
  { key: 'status', title: 'Status', accessor: ({ status }) => <StatusDisplay status={status} /> },
  { key: 'updatedByDisplayName', title: 'Officer' },
];

export const LabRequestAuditPane = ({ labRequest }) => (
  <DataFetchingTable columns={COLUMNS} endpoint={`labRequestLog/labRequest/${labRequest.id}`} />
);
