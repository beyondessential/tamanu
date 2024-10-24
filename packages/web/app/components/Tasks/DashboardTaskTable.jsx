import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import { TASK_STATUSES } from '@tamanu/constants';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';

import {
  BodyText,
  SmallBodyText,
  formatShortest,
  formatTime,
  TranslatedText,
  DataFetchingTable,
} from '../.';
import { Colors } from '../../constants';
import { ThemedTooltip } from '../Tooltip';

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
  position: absolute;
  left: -8px;
`;

const StyledTable = styled(DataFetchingTable)`
  border-left: 0px solid white;
  border-right: 0px solid white;
  border-radius: 0px;
  box-shadow: none;
  margin-top: 5px;
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    span {
      font-weight: 400;
      color: ${Colors.midText} !important;
    }
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 20px;
    }
  }
  .MuiTableCell-body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
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


const TooltipContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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

const NoDataContainer = styled.div`
  height: 354px;
  font-weight: 500;
  margin: 20px 0 20px 0;
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
      return (
        <StyledCheckCircleIcon />
      );
    case TASK_STATUSES.NON_COMPLETED:
      return (
        <StyledCancelIcon />
      );
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


const getTask = ({ name, requestedBy, requestTime, highPriority }) => (
  <StyledToolTip
    title={
      <TooltipContainer>
        <div>{name}</div>
        <div>{requestedBy.displayName}</div>
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
      stringId="encounter.tasks.table.noData"
      fallback="No patient tasks to display. Please try adjusting filters or click ‘+ New task’ to add a task to this patient."
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
    key: 'dueTime',
    title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Due at" />,
    accessor: getDueTime,
  },
  {
    key: 'name',
    title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Task" />,
  },
  {
    key: 'name',
    title: (
      <TranslatedText stringId="encounter.tasks.table.column.assignedTo" fallback="Assigned to" />
    ),
  },
  {
    key: 'name',
    title: (
      <TranslatedText stringId="encounter.tasks.table.column.frequency" fallback="Frequency" />
    ),
  },
  {
    key: 'dueTime',
    title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Due at" />,
    accessor: getDueTime,
  },
];

export const DashboardTasksTable = ({ encounterId, searchParameters, refreshCount, refreshTaskTable }) => {

  return (
    <StyledTable
      endpoint={`encounter/1297de11-e23e-460c-8cb1-4fa8b5df35ff/tasks`}
      columns={COLUMNS}
      noDataMessage={<NoDataMessage />}
      allowExport={false}
      fetchOptions={searchParameters}
      defaultRowsPerPage={25}
    />
  );
};
