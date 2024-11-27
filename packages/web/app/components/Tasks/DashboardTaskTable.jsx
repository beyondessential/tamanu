import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import { TASK_STATUSES, WS_EVENTS } from '@tamanu/constants';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';

import { BodyText, SmallBodyText, formatShortest, formatTime, TranslatedText, Table } from '../.';
import { Colors, ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { ThemedTooltip } from '../Tooltip';
import { useAuth } from '../../contexts/Auth';
import { useAutoUpdatingQuery } from '../../api/queries/useAutoUpdatingQuery';
import { Paginator } from '../Table/Paginator';
import { useTablePaginator } from '../Table/useTablePaginator';
import { useTableSorting } from '../Table/useTableSorting';

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
  position: absolute;
  left: -6px;
`;

const StyledTable = styled(Table)`
  max-height: 467px;
  min-height: ${p=> !p.isEmpty ? '467px' : '511px'};
  border-left: 0px solid white;
  border-right: 0px solid white;
  border-radius: 0px;
  box-shadow: none;
  margin-top: 5px;
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px;
    padding-bottom: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 20px;
    }
  }
  .MuiTableCell-body {
    padding-top: 4px;
    padding-bottom: 4px;
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 20px;
    }
    &:first-child {
      padding-left: 0px;
      padding-right: 0px;
      width: 20px;
    }
  }
  td {
    &:nth-child(2) {
      width: 22%;
    }
    &:nth-child(3) {
      width: 20%;
    }
    &:nth-child(4) {
      width: 20%;
    }
    &:nth-child(5) {
      position: relative;
      width: 28%;
    }
    &:nth-child(6) {
      width: 10%;
    }
  }
  .MuiTableFooter-root {
    background-color: ${Colors.white};
    .MuiPagination-root {
      padding-top: 6px;
      padding-bottom: 6px;
      margin-right: 0;
    }
    td > div:first-child {
      padding-top: 6px;
    }
  }
`;

const StatusTodo = styled.div`
  width: 15px;
  height: 15px;
  border: 1px dashed ${Colors.blue};
  border-radius: 50%;
`;

const StyledCancelIcon = styled(CancelIcon)`
  font-size: 18px;
  color: ${Colors.alert};
  vertical-align: middle;
`;

const StyledCheckCircleIcon = styled(CheckCircleIcon)`
  font-size: 18px;
  color: ${Colors.green};
  vertical-align: middle;
`;

const TooltipContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NoDataContainer = styled.div`
  height: 477px;
  font-weight: 500;
  margin: 5px 3px 20px 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 17%;
  white-space: normal;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

const StyledToolTip = styled(ThemedTooltip)`
  .MuiTooltip-tooltip {
    font-weight: 400;
  }
`;

const PaginatorContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: -14px;
  margin-bottom: -18px;
`;

const getStatus = row => {
  const { status } = row;
  switch (status) {
    case TASK_STATUSES.TODO:
      return (
        <Box marginLeft="1.5px">
          <StatusTodo />
        </Box>
      );
    case TASK_STATUSES.COMPLETED:
      return <StyledCheckCircleIcon />;
    case TASK_STATUSES.NON_COMPLETED:
      return <StyledCancelIcon />;
    default:
      break;
  }
};

const getDueTime = ({ dueTime }) => {
  return (
    <div>
      <BodyText sx={{ textTransform: 'lowercase' }}>{formatTime(dueTime)}</BodyText>
      <SmallBodyText color={Colors.midText}>{formatShortest(dueTime)}</SmallBodyText>
    </div>
  );
};

const getLocation = ({ encounter }) => (
  <div>
    <BodyText>{encounter.location.name}</BodyText>
    <SmallBodyText color={Colors.midText}>{encounter.location.locationGroup.name}</SmallBodyText>
  </div>
);

const getTaskName = ({ name, requestedBy, requestTime, highPriority }) => (
  <StyledToolTip
    title={
      <TooltipContainer>
        <div>{name}</div>
        <div>{requestedBy?.displayName}</div>
        <Box sx={{ textTransform: 'lowercase' }}>
          {`${formatShortest(requestTime)} ${formatTime(requestTime)}`}
        </Box>
      </TooltipContainer>
    }
  >
    <span>
      {highPriority && <StyledPriorityHighIcon />}
      {name}
    </span>
  </StyledToolTip>
);

const NoDataMessage = () => (
  <NoDataContainer>
    <TranslatedText
      stringId="dashboard.tasks.table.noData"
      fallback="No upcoming tasks to display. If applicable please try adjusting the filter."
    />
  </NoDataContainer>
);

const COLUMNS = [
  {
    accessor: getStatus,
    maxWidth: 20,
    sortable: false,
  },
  {
    key: 'locationName',
    title: <TranslatedText stringId="dashboard.tasks.table.column.location" fallback="Location" />,
    accessor: getLocation,
  },
  {
    key: 'encounter.patient.displayId',
    title: (
      <TranslatedText stringId="dashboard.tasks.table.column.patientId" fallback="Patient ID" />
    ),
    accessor: ({ encounter }) => encounter.patient.displayId,
  },
  {
    key: 'patientName',
    title: <TranslatedText stringId="dashboard.tasks.table.column.patient" fallback="Patient" />,
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
  },
  {
    key: 'name',
    title: <TranslatedText stringId="dashboard.tasks.table.column.task" fallback="Task" />,
    accessor: getTaskName,
  },
  {
    key: 'dueTime',
    title: <TranslatedText stringId="dashboard.tasks.table.column.task" fallback="Due at" />,
    accessor: getDueTime,
  },
];

export const DashboardTasksTable = ({ searchParameters, refreshCount }) => {
  const { currentUser } = useAuth();
  const [tableCount, setTableCount] = useState(0);

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } = useTablePaginator({
    resetPage: searchParameters,
  });

  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'dueTime',
    initialSortDirection: 'asc',
  });

  const queryParams = { ...searchParameters, page, rowsPerPage, orderBy, order };

  const { data: userTasks, isLoading } = useAutoUpdatingQuery(
    `user/${currentUser?.id}/tasks`,
    queryParams,
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:tasks`,
  );

  useEffect(() => {
    userTasks?.count && setTableCount(userTasks.count);
  }, [userTasks]);

  return (
    <div>
      <StyledTable
        data={userTasks?.data}
        columns={COLUMNS}
        noDataMessage={<NoDataMessage />}
        allowExport={false}
        isLoading={isLoading}
        refreshCount={refreshCount}
        count={userTasks?.count}
        onChangeOrderBy={onChangeOrderBy}
        orderBy={orderBy}
        order={order}
        hideHeader={!userTasks?.count}
        isEmpty={!userTasks?.count && !isLoading}
      />
      {!!userTasks?.count && !isLoading && (
        <PaginatorContainer>
          <Paginator
            page={page}
            colSpan={COLUMNS.length}
            count={tableCount}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          />
        </PaginatorContainer>
      )}
    </div>
  );
};
