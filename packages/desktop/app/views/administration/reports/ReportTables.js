import React from 'react';
import styled from 'styled-components';
import { REPORT_STATUSES } from '@tamanu/constants';
import { DateDisplay, formatTime } from '../../../components';
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

export const ReportTable = React.memo(({ data, selected, onRowClick, loading, error }) => (
  <StyledTable
    onRowClick={onRowClick}
    rowStyle={({ id }) => ({
      backgroundColor: selected === id ? Colors.veryLightBlue : Colors.white,
    })}
    columns={[
      {
        title: 'Name',
        key: 'name',
      },
      {
        title: 'Last updated',
        key: 'lastUpdated',
        accessor: ({ lastUpdated }) => getDateTime(lastUpdated),
      },
      {
        title: 'Version count',
        key: 'versionCount',
        numeric: true,
        accessor: ({ versionCount }) => versionCount || 0,
      },
    ]}
    data={data}
    isLoading={loading}
    errorMessage={error}
    elevated={false}
    allowExport={false}
  />
));

export const VersionTable = React.memo(({ data, onRowClick, loading, error }) => (
  <StyledTable
    allowExport={false}
    onRowClick={onRowClick}
    columns={[
      {
        title: 'Version',
        key: 'versionNumber',
      },
      {
        title: 'Created time',
        key: 'createdAt',
        accessor: ({ updatedAt }) => getDateTime(updatedAt),
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
  />
));
