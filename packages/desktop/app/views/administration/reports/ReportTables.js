import React, { useState } from 'react';
import styled from 'styled-components';
import { REPORT_STATUSES } from '@tamanu/constants';
import { formatShort, formatTime } from '../../../components';
import { Table } from '../../../components/Table';
import { Colors } from '../../../constants';
import { StatusTag } from '../../../components/Tag';

const STATUS_CONFIG = {
  [REPORT_STATUSES.DRAFT]: {
    background: Colors.background,
    color: Colors.darkGrey,
  },
  [REPORT_STATUSES.PUBLISHED]: {
    color: Colors.green,
    background: '#DEF0EE',
  },
  active: {
    color: Colors.white,
    background: Colors.green,
  },
};

const StyledTable = styled(Table)`
  max-height: 500px;
  table {
    thead tr th {
      position: sticky;
      top: 0;
      background-color: ${Colors.offWhite};
      z-index: 1;
    }
  }
`;

const ReportStatusTag = ({ status }) => {
  const { background, color } = STATUS_CONFIG[status];
  return (
    <StatusTag $background={background} $color={color}>
      {status}
    </StatusTag>
  );
};

const useTableSorting = () => {
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState('asc');

  const customSort = (data = []) => {
    const sortedData = data.sort((a, b) => {
      if (typeof a[orderBy] === 'string') {
        return order === 'asc'
          ? a[orderBy].localeCompare(b[orderBy])
          : b[orderBy].localeCompare(a[orderBy]);
      }
      return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
    });
    return sortedData;
  };

  const onChangeOrderBy = sortKey => {
    setOrderBy(sortKey);
    const isDesc = orderBy === sortKey && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
  };

  return { orderBy, order, onChangeOrderBy, customSort };
};

export const ReportTable = React.memo(({ data, selected, onRowClick, loading, error }) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting();

  return (
    <StyledTable
      onRowClick={onRowClick}
      rowStyle={({ id }) => ({
        backgroundColor: selected === id ? Colors.veryLightBlue : Colors.white,
      })}
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
          accessor: ({ lastUpdated }) =>
            lastUpdated ? `${formatShort(lastUpdated)} ${formatTime(lastUpdated)}` : '-',
        },
        {
          title: 'Version count',
          key: 'versionCount',
          numeric: true,
          minWidth: 200,
          accessor: ({ versionCount }) => versionCount || 0,
        },
      ]}
      data={data}
      isLoading={loading}
      errorMessage={error}
      elevated={false}
      allowExport={false}
      onChangeOrderBy={onChangeOrderBy}
      customSort={customSort}
      orderBy={orderBy}
      order={order}
      initialSort={{ orderBy: 'name', order: 'desc' }}
    />
  );
});

export const VersionTable = React.memo(({ data, onRowClick, loading, error }) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting();

  return (
    <StyledTable
      allowExport={false}
      onRowClick={onRowClick}
      columns={[
        {
          title: 'Version',
          key: 'versionNumber',
          minWidth: 200,
        },
        {
          title: 'Created time',
          key: 'createdAt',
          minWidth: 300,
          accessor: ({ updatedAt }) => `${formatShort(updatedAt)} ${formatTime(updatedAt)}`,
        },
        {
          title: 'Status',
          key: 'status',
          accessor: ({ status, active }) => <ReportStatusTag status={active ? 'active' : status} />,
        },
      ]}
      data={data}
      elevated={false}
      isLoading={loading}
      errorMessage={error}
      onChangeOrderBy={onChangeOrderBy}
      customSort={customSort}
      orderBy={orderBy}
      order={order}
    />
  );
});
