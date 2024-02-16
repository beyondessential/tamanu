import React from 'react';
import styled from 'styled-components';
import { REPORT_STATUSES } from '@tamanu/constants';
import { DateDisplay, formatTime } from '../../../components';
import { Table } from '../../../components/Table';
import { Colors } from '../../../constants';
import { StatusTag } from '../../../components/Tag';
import { useTableSorting } from '../../../components/Table/useTableSorting';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

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
  max-width: 520px;
  overflow-y: auto;
  table {
    thead {
      position: sticky;
      top: 0;
      z-index: 1;
      background-color: ${Colors.offWhite};
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

const getDateTime = value => {
  if (!value) return '-';

  const date = DateDisplay.stringFormat(value);
  const time = DateDisplay.stringFormat(value, formatTime);
  return `${date} ${time}`;
};

export const ReportTable = React.memo(({ data, selected, onRowClick, loading, error }) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: 'name',
    initialSortDirection: 'asc',
  });

  return (
    <StyledTable
      onRowClick={onRowClick}
      rowStyle={({ id }) => ({
        backgroundColor: selected === id ? Colors.veryLightBlue : Colors.white,
      })}
      columns={[
        {
          title: <TranslatedText stringId="admin.report.list.table.column.name" fallback="Name" />,
          key: 'name',
        },
        {
          title: <TranslatedText stringId="admin.report.list.table.column.lastUpdated" fallback="Last updated" />,
          key: 'lastUpdated',
          accessor: ({ lastUpdated }) => getDateTime(lastUpdated),
        },
        {
          title: <TranslatedText stringId="admin.report.list.table.column.versionCount" fallback="Version count" />,
          key: 'versionCount',
          numeric: true,
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
    />
  );
});

export const VersionTable = React.memo(({ data, onRowClick, loading, error }) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: 'createdAt',
    initialSortDirection: 'desc',
  });

  return (
    <StyledTable
      allowExport={false}
      onRowClick={onRowClick}
      columns={[
        {
          title: <TranslatedText stringId="admin.report.list.table.column.versionNumber" fallback="Version" />,
          key: 'versionNumber',
        },
        {
          title: <TranslatedText stringId="admin.report.list.table.column.createdAt" fallback="Created time" />,
          key: 'createdAt',
          accessor: ({ updatedAt }) => getDateTime(updatedAt),
        },
        {
          title: <TranslatedText stringId="admin.report.list.table.column.status" fallback="Status" />,
          key: 'status',
          sortable: false,
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
