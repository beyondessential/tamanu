import React from 'react';
import styled from 'styled-components';
import { REPORT_STATUSES } from '@tamanu/constants';
import { TranslatedText, useDateTimeFormat } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Table } from '../../../components/Table';
import { StatusTag } from '../../../components/Tag';
import { useTableSorting } from '../../../components/Table/useTableSorting';

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
    <StatusTag $background={background} $color={color} data-testid="statustag-t5q4">
      {status}
    </StatusTag>
  );
};

export const ReportTable = React.memo(({ data, selected, onRowClick, loading, error }) => {
  const { formatShort, formatTime } = useDateTimeFormat();
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
          title: (
            <TranslatedText
              stringId="admin.report.list.table.column.name"
              fallback="Name"
              data-testid="translatedtext-zpe8"
            />
          ),
          key: 'name',
        },
        {
          title: (
            <TranslatedText
              stringId="general.lastUpdated.label"
              fallback="Last updated"
              data-testid="translatedtext-iynb"
            />
          ),
          key: 'lastUpdated',
          accessor: ({ lastUpdated }) => `${formatShort(lastUpdated)} ${formatTime(lastUpdated)}`,
        },
        {
          title: (
            <TranslatedText
              stringId="admin.report.list.table.column.versionCount"
              fallback="Version count"
              data-testid="translatedtext-1fp7"
            />
          ),
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
      data-testid="styledtable-qv8v"
    />
  );
});

export const VersionTable = React.memo(({ data, onRowClick, loading, error }) => {
  const { formatShort, formatTime } = useDateTimeFormat();
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
          title: (
            <TranslatedText
              stringId="admin.report.list.table.column.versionNumber"
              fallback="Version"
              data-testid="translatedtext-5jxq"
            />
          ),
          key: 'versionNumber',
        },
        {
          title: (
            <TranslatedText
              stringId="admin.report.list.table.column.createdAt"
              fallback="Created time"
              data-testid="translatedtext-ao5z"
            />
          ),
          key: 'createdAt',
          accessor: ({ updatedAt }) => `${formatShort(updatedAt)} ${formatTime(updatedAt)}`,
        },
        {
          title: (
            <TranslatedText
              stringId="admin.report.list.table.column.status"
              fallback="Status"
              data-testid="translatedtext-id75"
            />
          ),
          key: 'status',
          sortable: false,
          accessor: ({ status, active }) => (
            <ReportStatusTag
              status={active ? 'active' : status}
              data-testid="reportstatustag-ai1o"
            />
          ),
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
      data-testid="styledtable-xo9e"
    />
  );
});
