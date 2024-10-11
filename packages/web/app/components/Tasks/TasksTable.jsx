import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { TASK_STATUSES, TASK_ACTIONS } from '@tamanu/constants';
import {
  BodyText,
  SmallBodyText,
  formatShortest,
  formatTime,
  TranslatedText,
  useSelectableColumn,
  DataFetchingTable,
} from '../.';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';
import { TaskActionModal } from './TaskActionModal';

const StyledTable = styled(DataFetchingTable)`
  margin-top: 6px;
  box-shadow: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 0px;
  overflow: visible;
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    span {
      font-weight: 400;
      color: ${Colors.midText} !important;
    }
    padding-left: 7px;
    padding-right: 7px;
    &:last-child {
      padding-right: 20px;
    }
    &:first-child {
      padding-left: 0px;
      width: 15px;
    }
    &:nth-child(2) {
      padding-left: 0px;
    }
  }
  .MuiTableCell-body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    padding-left: 7px;
    padding-right: 7px;
    &:last-child {
      padding-right: 0px;
    }
    &:first-child,
    &:nth-child(2) {
      padding-left: 0px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      box-shadow: 10px 10px 15px 0px rgba(0, 0, 0, 0.1);
    }
    max-height: 42px;
  }
  .MuiFormControlLabel-root {
    margin-right: 1px;
  }
  .MuiCheckbox-root {
    padding: 0 8px 0 0;
  }
  td {
    &:last-child {
      max-width: 200px;
      white-space: nowrap;
      width: 200px;
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

const StyledBulkActions = styled.div`
  display: flex;
  gap: 15px;
  padding-right: 10px;
  align-items: center;
`;

const NotesDisplay = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

const OverflowedBox = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IconButton = styled.div`
  cursor: pointer;
`;

const TooltipContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledDeleteOutlineIcon = styled(DeleteOutlineIcon)`
  font-size: 18px;
  color: ${Colors.primary};
  vertical-align: middle;
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

const StyledDivider = styled(Divider)`
  margin-top: 5px;
  margin-bottom: 5px;
`;

const StatusTooltip = styled.div`
  text-align: center;
`;

const LowercaseText = styled.span`
  text-transform: lowercase;
`;

const getCompletedTooltipText = ({ completedBy, completedTime, completedNote }) => (
  <StatusTooltip>
    <TranslatedText stringId="tasks.table.tooltip.completed" fallback="Completed" />
    <div>{completedBy.displayName}</div>
    <div>
      <span color={Colors.midText}>{formatShortest(completedTime)} </span>
      <LowercaseText>{formatTime(completedTime)}</LowercaseText>
    </div>
    <div>{completedNote}</div>
  </StatusTooltip>
);

const getNotCompletedTooltipText = ({ notCompletedBy, notCompletedTime, notCompletedReason }) => (
  <StatusTooltip>
    <TranslatedText stringId="tasks.table.tooltip.notCompleted" fallback="Not completed" />
    <div>{notCompletedBy.displayName}</div>
    <div>
      <span color={Colors.midText}>{formatShortest(notCompletedTime)} </span>
      <LowercaseText>{formatTime(notCompletedTime)}</LowercaseText>
    </div>
    <div>{notCompletedReason?.name}</div>
  </StatusTooltip>
);

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
        <ThemedTooltip title={getCompletedTooltipText(row)}>
          <StyledCheckCircleIcon />
        </ThemedTooltip>
      );
    case TASK_STATUSES.NON_COMPLETED:
      return (
        <ThemedTooltip title={getNotCompletedTooltipText(row)}>
          <StyledCancelIcon />
        </ThemedTooltip>
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

const AssignedToCell = ({ designations }) => {
  const [ref, isOverflowing] = useOverflow();
  if (!designations?.length) return '-';

  const designationNames = designations.map(assigned => assigned.name);
  return (
    <ConditionalTooltip visible={isOverflowing} title={designationNames.join(', ')}>
      <OverflowedBox ref={ref}>{designationNames.join(', ')}</OverflowedBox>
    </ConditionalTooltip>
  );
};

const getFrequency = ({ frequencyValue, frequencyUnit }) =>
  frequencyValue && frequencyUnit ? (
    `${frequencyValue} ${frequencyUnit}`
  ) : (
    <TranslatedText stringId="encounter.tasks.table.once" fallback="Once" />
  );

const BulkActions = ({ row, status, handleActionModalOpen }) => (
  <StyledBulkActions>
    {status !== TASK_STATUSES.NON_COMPLETED && (
      <ThemedTooltip
        title={
          <TranslatedText
            stringId="encounter.tasks.action.tooltip.notCompleted"
            fallback="Mark as not complete"
          />
        }
      >
        <IconButton onClick={() => handleActionModalOpen(TASK_ACTIONS.NON_COMPLETED, row)}>
          <StyledCancelIcon />
        </IconButton>
      </ThemedTooltip>
    )}
    {status !== TASK_STATUSES.COMPLETED && (
      <ThemedTooltip
        title={
          <TranslatedText
            stringId="encounter.tasks.action.tooltip.completed"
            fallback="Mark as complete"
          />
        }
      >
        <IconButton onClick={() => handleActionModalOpen(TASK_ACTIONS.COMPLETED, row)}>
          <StyledCheckCircleIcon />
        </IconButton>
      </ThemedTooltip>
    )}
    {status !== TASK_STATUSES.TODO && (
      <ThemedTooltip
        title={
          <TranslatedText stringId="encounter.tasks.action.tooltip.toDo" fallback="Mark as to-do" />
        }
      >
        <IconButton onClick={() => handleActionModalOpen(TASK_ACTIONS.TODO, row)}>
          <StatusTodo />
        </IconButton>
      </ThemedTooltip>
    )}
    {status === TASK_STATUSES.TODO && (
      <ThemedTooltip
        title={
          <TranslatedText stringId="encounter.tasks.action.tooltip.delete" fallback="Delete" />
        }
      >
        <IconButton onClick={() => handleActionModalOpen(TASK_ACTIONS.DELETED, row)}>
          <StyledDeleteOutlineIcon />
        </IconButton>
      </ThemedTooltip>
    )}
  </StyledBulkActions>
);

const NotesCell = ({ row, hoveredRow, handleActionModalOpen }) => {
  const [ref, isOverflowing] = useOverflow();
  const { note, status } = row;

  return (
    <Box display="flex" alignItems="center">
      <NotesDisplay>
        {note ? (
          <ConditionalTooltip visible={isOverflowing} title={note}>
            <OverflowedBox ref={ref}>{note}</OverflowedBox>
          </ConditionalTooltip>
        ) : (
          '-'
        )}
      </NotesDisplay>
      {hoveredRow?.id === row?.id && (
        <BulkActions row={row} status={status} handleActionModalOpen={handleActionModalOpen} />
      )}
    </Box>
  );
};

const getTask = ({ name, requestedBy, requestTime }) => (
  <ThemedTooltip
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
    <span>{name}</span>
  </ThemedTooltip>
);

const NoDataMessage = () => (
  <NoDataContainer>
    <TranslatedText
      stringId="encounter.tasks.table.noData"
      fallback="No patient tasks to display. Please try adjusting filters or click ‘+ New task’ to add a task to this patient."
    />
  </NoDataContainer>
);

export const TasksTable = ({ encounterId, searchParameters, refreshCount, refreshTaskTable }) => {
  const [hoveredRow, setHoveredRow] = useState();
  const [data, setData] = useState([]);
  const [actionModal, setActionModal] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const onDataFetched = useCallback(({ data }) => {
    setData(data);
  }, []);

  const handleActionModalOpen = (action, task) => {
    setActionModal(action);
    setSelectedTask(task);
  };

  const handleActionModalClose = () => {
    setActionModal('');
    setSelectedTask(null);
  };

  const { selectedRows, selectableColumn, resetSelection } = useSelectableColumn(data, {
    showIndeterminate: true,
    getIsRowDisabled: (selectedKeys, { status }) => {
      const selectedStatus = data.find(({ id }) => selectedKeys.has(id))?.status;
      return selectedStatus && status !== selectedStatus;
    },
    getIsTitleDisabled: selectedKeys => {
      const uniqueStatuses = new Set(data.map(item => item.status));
      return uniqueStatuses.size > 1 && !selectedKeys.size;
    },
    getRowsFilterer: selectedKeys => row => {
      const selectedStatus = data.find(({ id }) => selectedKeys.has(id))?.status;
      return !selectedStatus || row.status === selectedStatus;
    },
  });

  useEffect(() => {
    resetSelection();
  }, [searchParameters, resetSelection]);

  const selectedRowIds = useMemo(() => selectedRows.map(row => row.id), [selectedRows]);

  const COLUMNS = [
    {
      accessor: getStatus,
      maxWidth: 20,
      sortable: false,
    },
    {
      key: 'name',
      title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Task" />,
      maxWidth: 160,
      accessor: getTask,
    },
    {
      key: 'dueTime',
      title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Due at" />,
      accessor: getDueTime,
      maxWidth: 60,
    },
    {
      key: 'assignedTo',
      title: (
        <TranslatedText stringId="encounter.tasks.table.column.assignedTo" fallback="Assigned to" />
      ),
      maxWidth: 100,
      sortable: false,
      accessor: ({ designations }) => <AssignedToCell designations={designations} />,
    },
    {
      key: 'frequency',
      title: (
        <TranslatedText stringId="encounter.tasks.table.column.frequency" fallback="Frequency" />
      ),
      maxWidth: 90,
      accessor: getFrequency,
      sortable: false,
    },
    {
      key: 'note',
      title: <TranslatedText stringId="encounter.tasks.table.column.notes" fallback="Notes" />,
      accessor: row => (
        <NotesCell
          row={row}
          hoveredRow={hoveredRow}
          handleActionModalOpen={handleActionModalOpen}
        />
      ),
      sortable: false,
    },
  ];

  const isRepeatingTask = useMemo(
    () =>
      selectedTask?.id
        ? selectedTask?.frequencyValue && selectedTask?.frequencyUnit
        : selectedRows.some(row => row.frequencyValue && row.frequencyUnit),
    [selectedRows, selectedTask],
  );
  const handleMouseEnterRow = data => {
    setHoveredRow(data);
  };

  const handleMouseLeaveRow = () => {
    setHoveredRow(null);
  };

  return (
    <div>
      <TaskActionModal
        open={!!actionModal}
        onClose={handleActionModalClose}
        action={actionModal}
        refreshTaskTable={refreshTaskTable}
        taskIds={selectedTask?.id ? [selectedTask.id] : selectedRowIds}
        isRepeatingTask={isRepeatingTask}
      />
      {selectedRows.length > 0 && (
        <div>
          <StyledDivider />
          <BulkActions
            status={selectedRows[0].status}
            handleActionModalOpen={handleActionModalOpen}
          />
        </div>
      )}
      <StyledTable
        endpoint={`encounter/${encounterId}/tasks`}
        columns={[selectableColumn, ...COLUMNS]}
        noDataMessage={<NoDataMessage />}
        allowExport={false}
        onMouseEnterRow={handleMouseEnterRow}
        onMouseLeaveRow={handleMouseLeaveRow}
        hideHeader={data.length === 0}
        fetchOptions={searchParameters}
        onDataFetched={onDataFetched}
        refreshCount={refreshCount}
      />
    </div>
  );
};
