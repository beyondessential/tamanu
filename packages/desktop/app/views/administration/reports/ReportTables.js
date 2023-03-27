import React from 'react';
import { formatShort, formatTime } from '../../../components';
import { Table } from '../../../components/Table';

export const ReportTable = React.memo(({ data, selected, onRowClick, loading, error }) => (
  <Table
    allowExport={false}
    onRowClick={onRowClick}
    rowStyle={({ id }) => (id === selected ? { backgroundColor: '#f5f5f5' } : {})}
    columns={[
      {
        title: 'Name',
        key: 'name',
        minWidth: 400,
      },
      {
        title: 'Last updated',
        key: 'lastUpdated',
        minWidth: 300,
        accessor: ({ lastUpdated }) => new Date(lastUpdated).toLocaleString(),
      },
      {
        title: 'Version count',
        key: 'versionCount',
        numeric: true,
        minWidth: 200,
      },
    ]}
    data={data}
    elevated={false}
    isLoading={loading}
    errorMessage={error}
  />
));

export const VersionTable = React.memo(({ data, onRowClick, loading, error }) => (
  <Table
    allowExport={false}
    onRowClick={onRowClick}
    columns={[
      {
        title: 'Version number',
        key: 'versionNumber',
        minWidth: 200,
      },
      {
        title: 'Last updated',
        key: 'updatedAt',
        minWidth: 300,
        accessor: ({ updatedAt }) => `${formatShort(updatedAt)} ${formatTime(updatedAt)}`,
      },
      {
        title: 'Status',
        key: 'status',
      },
    ]}
    data={data}
    elevated={false}
    isLoading={loading}
    errorMessage={error}
  />
));
