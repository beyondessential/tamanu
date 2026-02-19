import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { TASK_STATUSES, TASK_ACTIONS, TASK_DURATION_UNIT } from '@tamanu/constants';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { differenceInHours, parseISO, addMilliseconds, subMilliseconds } from 'date-fns';
import { formatShortest, formatTime } from '@tamanu/utils/dateTime';

import {
  BodyText,
  SmallBodyText,
  TranslatedText,
  useSelectableColumn,
  DataFetchingTable,
} from '../.';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import { ThemedTooltip } from '../Tooltip';
import { TaskActionModal } from './TaskActionModal';
import { useAuth } from '../../contexts/Auth';
import ms from 'ms';
import { useEncounter } from '../../contexts/Encounter';

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
  position: absolute;
  left: -8px;
`;

const StyledTable = styled(DataFetchingTable)`
  margin-top: 6px;
  box-shadow: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 0px;
  overflow: visible;
  min-width: 700px;
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
      ${p => (p.$canDoAction ? `width: 15px;` : '')}
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
    &:first-child {
      padding-left: 0px;
    }
    &:nth-child(2) {
      ${p => (p.$canDoAction ? `padding-left: 0px;` : '')}
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    transition: all 250ms;
    &:hover {
      box-shadow: ${props =>
        props.disableHoverEffect ? 'none' : '10px 10px 15px 0px rgba(0, 0, 0, 0.1)'};
    }
    position: relative;
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
      max-width: 188px;
      white-space: nowrap;
      min-width: 188px;
    }
    &:nth-child(2),
    &:nth-child(3) {
      position: relative;
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

const StyledActionsRow = styled.div`
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

const ScrollableTableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

const StyledToolTip = styled(ThemedTooltip)`
  .MuiTooltip-tooltip {
    font-weight: 400;
  }
`;

const TableTooltip = ({ title, children }) => (
  <StyledToolTip
    title={title}
    PopperProps={{
      popperOptions: {
        positionFixed: true,
        modifiers: {
          preventOverflow: {
            enabled: true,
            boundariesElement: 'window',
          },
        },
      },
    }}
    data-testid="styledtooltip-2imm"
  >
    {children}
  </StyledToolTip>
);

const getCompletedTooltipText = ({ completedBy, completedTime, completedNote }) => (
  <StatusTooltip data-testid="statustooltip-mfnp">
    <TranslatedText
      stringId="tasks.table.tooltip.completed"
      fallback="Completed"
      data-testid="translatedtext-sd05"
    />
    <div>{completedBy.displayName}</div>
    <div>
      <span color={Colors.midText}>{formatShortest(completedTime)} </span>
      <LowercaseText data-testid="lowercasetext-5r41">{formatTime(completedTime)}</LowercaseText>
    </div>
    <div>{completedNote}</div>
  </StatusTooltip>
);

const getNotCompletedTooltipText = ({ notCompletedBy, notCompletedTime, notCompletedReason }) => (
  <StatusTooltip data-testid="statustooltip-gqmz">
    <TranslatedText
      stringId="tasks.table.tooltip.notCompleted"
      fallback="Not completed"
      data-testid="translatedtext-ir0v"
    />
    <div>{notCompletedBy.displayName}</div>
    <div>
      <span color={Colors.midText}>{formatShortest(notCompletedTime)} </span>
      <LowercaseText data-testid="lowercasetext-w9wo">{formatTime(notCompletedTime)}</LowercaseText>
    </div>
    <div>{notCompletedReason?.name}</div>
  </StatusTooltip>
);

const getStatus = row => {
  const { status } = row;
  switch (status) {
    case TASK_STATUSES.TODO:
      return (
        <Box marginLeft="1.5px" data-testid="box-6w7t">
          <StatusTodo data-testid="statustodo-yit3" />
        </Box>
      );
    case TASK_STATUSES.COMPLETED:
      return (
        <TableTooltip title={getCompletedTooltipText(row)} data-testid="tabletooltip-8kog">
          <StyledCheckCircleIcon data-testid="styledcheckcircleicon-aayi" />
        </TableTooltip>
      );
    case TASK_STATUSES.NON_COMPLETED:
      return (
        <TableTooltip title={getNotCompletedTooltipText(row)} data-testid="tabletooltip-15ji">
          <StyledCancelIcon data-testid="styledcancelicon-z0lw" />
        </TableTooltip>
      );
    default:
      break;
  }
};

const getDueTime = ({ dueTime }) => {
  return (
    <div>
      <BodyText sx={{ textTransform: 'lowercase' }} data-testid="bodytext-24uw">
        {formatTime(dueTime)}
      </BodyText>
      <SmallBodyText color={Colors.midText} data-testid="smallbodytext-7kv1">
        {formatShortest(dueTime)}
      </SmallBodyText>
    </div>
  );
};

const AssignedToCell = ({ designations }) => {
  const [ref, isOverflowing] = useOverflow();
  if (!designations?.length) return '-';

  const designationNames = designations.map(assigned => assigned.name);

  if (!isOverflowing) {
    return (
      <OverflowedBox ref={ref} data-testid="overflowedbox-f6me">
        {designationNames.join(', ')}
      </OverflowedBox>
    );
  }

  return (
    <TableTooltip title={designationNames.join(', ')} data-testid="tabletooltip-00e0">
      <OverflowedBox ref={ref} data-testid="overflowedbox-m7gx">
        {designationNames.join(', ')}
      </OverflowedBox>
    </TableTooltip>
  );
};

const getFrequency = (task, isEncounterDischarged) => {
  const { frequencyValue, frequencyUnit, durationValue, durationUnit, parentTask } = task;
  const isRepeatingTask = frequencyValue && frequencyUnit;

  const getDurationTooltip = () => {
    // If no duration is set, task is ongoing
    if (!durationValue || !durationUnit) {
      return <TranslatedText stringId="encounter.tasks.table.ongoing" fallback="Ongoing" />;
    }

    // Calculate end date based on due time, frequency and duration
    try {
      const firstTask = parentTask || task;
      const frequency = ms(`${frequencyValue} ${frequencyUnit}`);
      let endDate = new Date(firstTask.dueTime);

      switch (durationUnit) {
        case TASK_DURATION_UNIT.OCCURRENCES:
          endDate = addMilliseconds(endDate, frequency * (durationValue - 1));
          break;
        default: {
          const duration = ms(`${durationValue} ${durationUnit}`);
          endDate = addMilliseconds(endDate, duration);
          let maxDate = new Date(firstTask.dueTime);
          while (maxDate <= endDate) {
            maxDate = addMilliseconds(maxDate, frequency);
          }
          endDate = subMilliseconds(maxDate, frequency);
          break;
        }
      }

      return (
        <TranslatedText
          stringId="encounter.tasks.table.duration.endDate"
          fallback={`Ends at :time on :date`}
          replacements={{
            time: formatTime(endDate)
              .toLowerCase()
              .replaceAll(' ', ''),
            date: formatShortest(endDate),
          }}
        />
      );
    } catch (error) {
      console.error('Error calculating task end date:', error);
      return <TranslatedText stringId="encounter.tasks.table.ongoing" fallback="Ongoing" />;
    }
  };

  if (isRepeatingTask) {
    return (
      <TableTooltip title={isEncounterDischarged ? '' : getDurationTooltip()}>
        <span>{`${frequencyValue} ${frequencyUnit}${Number(frequencyValue) > 1 ? 's' : ''}`}</span>
      </TableTooltip>
    );
  }

  return <TranslatedText stringId="encounter.tasks.table.once" fallback="Once" />;
};
const getIsTaskOverdue = task => differenceInHours(new Date(), parseISO(task.dueTime)) >= 48;

const ActionsRow = ({ row, rows, handleActionModalOpen }) => {
  const status = row?.status || rows[0]?.status;

  const { ability } = useAuth();
  const canWrite = ability.can('write', 'Tasking');
  const canDelete = ability.can('delete', 'Tasking');

  const isTaskOverdue = row ? getIsTaskOverdue(row) : rows.some(getIsTaskOverdue);

  return (
    <StyledActionsRow data-testid="styledactionsrow-663u">
      {status !== TASK_STATUSES.COMPLETED && canWrite && (
        <TableTooltip
          title={
            <TranslatedText
              stringId="encounter.tasks.action.tooltip.completed"
              fallback="Mark as complete"
              data-testid="translatedtext-13fb"
            />
          }
          data-testid="tabletooltip-qd11"
        >
          <IconButton
            onClick={() => handleActionModalOpen(TASK_ACTIONS.COMPLETED, row)}
            data-testid="iconbutton-0wvd"
          >
            <StyledCheckCircleIcon data-testid="styledcheckcircleicon-31o6" />
          </IconButton>
        </TableTooltip>
      )}
      {status !== TASK_STATUSES.NON_COMPLETED && canWrite && (
        <TableTooltip
          title={
            <TranslatedText
              stringId="encounter.tasks.action.tooltip.notCompleted"
              fallback="Mark as not complete"
              data-testid="translatedtext-rms0"
            />
          }
          data-testid="tabletooltip-w8qq"
        >
          <IconButton
            onClick={() => handleActionModalOpen(TASK_ACTIONS.NON_COMPLETED, row)}
            data-testid="iconbutton-vptw"
          >
            <StyledCancelIcon data-testid="styledcancelicon-nzdl" />
          </IconButton>
        </TableTooltip>
      )}
      {status !== TASK_STATUSES.TODO && canWrite && !isTaskOverdue && (
        <TableTooltip
          title={
            <TranslatedText
              stringId="encounter.tasks.action.tooltip.toDo"
              fallback="Mark as to-do"
              data-testid="translatedtext-iay4"
            />
          }
          data-testid="tabletooltip-ozfq"
        >
          <IconButton
            onClick={() => handleActionModalOpen(TASK_ACTIONS.TODO, row)}
            data-testid="iconbutton-si29"
          >
            <StatusTodo data-testid="statustodo-1wc8" />
          </IconButton>
        </TableTooltip>
      )}
      {status === TASK_STATUSES.TODO && canDelete && (
        <TableTooltip
          title={
            <TranslatedText
              stringId="encounter.tasks.action.tooltip.delete"
              fallback="Delete"
              data-testid="translatedtext-ouy9"
            />
          }
          data-testid="tabletooltip-5owh"
        >
          <IconButton
            onClick={() => handleActionModalOpen(TASK_ACTIONS.DELETED, row)}
            data-testid="iconbutton-edm0"
          >
            <StyledDeleteOutlineIcon data-testid="styleddeleteoutlineicon-w3ya" />
          </IconButton>
        </TableTooltip>
      )}
    </StyledActionsRow>
  );
};

const NotesCell = ({ row, hoveredRow, handleActionModalOpen }) => {
  const [ref, isOverflowing] = useOverflow();
  const { note } = row;

  return (
    <Box display="flex" alignItems="center" data-testid="box-lxyf">
      <NotesDisplay data-testid="notesdisplay-uohi">
        {note ? (
          !isOverflowing ? (
            <OverflowedBox ref={ref} data-testid="overflowedbox-jgvv">
              {note}
            </OverflowedBox>
          ) : (
            <TableTooltip title={note} data-testid="tabletooltip-xeqv">
              <OverflowedBox ref={ref} data-testid="overflowedbox-cu6i">
                {note}
              </OverflowedBox>
            </TableTooltip>
          )
        ) : (
          '-'
        )}
      </NotesDisplay>
      {hoveredRow?.id === row?.id && (
        <ActionsRow
          row={row}
          handleActionModalOpen={handleActionModalOpen}
          data-testid="actionsrow-skhr"
        />
      )}
    </Box>
  );
};

const getTask = ({ name, requestedBy, requestTime, highPriority }) => (
  <TableTooltip
    title={
      <TooltipContainer data-testid="tooltipcontainer-y0r6">
        <div>{name}</div>
        <div>{requestedBy.displayName}</div>
        <Box sx={{ textTransform: 'lowercase' }} data-testid="box-fmnt">
          {`${formatShortest(requestTime)} ${formatTime(requestTime)}`}
        </Box>
      </TooltipContainer>
    }
    data-testid="tabletooltip-xlct"
  >
    <span>
      {highPriority && <StyledPriorityHighIcon data-testid="styledpriorityhighicon-7slu" />}
      {name}
    </span>
  </TableTooltip>
);

const NoDataMessage = () => (
  <NoDataContainer data-testid="nodatacontainer-476e">
    <TranslatedText
      stringId="encounter.tasks.table.noData"
      fallback="No patient tasks to display. Please try adjusting filters or click ‘+ New task’ to add a task to this patient."
      data-testid="translatedtext-a510"
    />
  </NoDataContainer>
);

export const TasksTable = ({ encounterId, searchParameters, refreshCount, refreshTaskTable }) => {
  const { ability } = useAuth();
  const { encounter } = useEncounter();
  const canWrite = ability.can('write', 'Tasking');
  const canDelete = ability.can('delete', 'Tasking');
  const canDoAction = canWrite || canDelete;

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
  }, [searchParameters, refreshCount, resetSelection]);

  const selectedRowIds = useMemo(() => selectedRows.map(row => row.id), [selectedRows]);

  const COLUMNS = [
    {
      key: '',
      accessor: getStatus,
      maxWidth: 20,
      sortable: false,
    },
    {
      key: 'name',
      title: (
        <TranslatedText
          stringId="encounter.tasks.table.column.task"
          fallback="Task"
          data-testid="translatedtext-dw5r"
        />
      ),
      maxWidth: 160,
      accessor: getTask,
    },
    {
      key: 'dueTime',
      title: (
        <TranslatedText
          stringId="encounter.tasks.table.column.dueTime"
          fallback="Due at"
          data-testid="translatedtext-8mqq"
        />
      ),
      accessor: getDueTime,
      maxWidth: 60,
    },
    {
      key: 'assignedTo',
      title: (
        <TranslatedText
          stringId="encounter.tasks.table.column.assignedTo"
          fallback="Assigned to"
          data-testid="translatedtext-m7hr"
        />
      ),
      maxWidth: 100,
      sortable: false,
      accessor: ({ designations }) => (
        <AssignedToCell designations={designations} data-testid="assignedtocell-xea5" />
      ),
    },
    {
      key: 'frequency',
      title: (
        <TranslatedText
          stringId="encounter.tasks.table.column.frequency"
          fallback="Frequency"
          data-testid="translatedtext-nr0u"
        />
      ),
      maxWidth: 90,
      accessor: task => getFrequency(task, !!encounter?.endDate),
      sortable: false,
    },
    {
      key: 'note',
      title: (
        <TranslatedText
          stringId="encounter.tasks.table.column.notes"
          fallback="Notes"
          data-testid="translatedtext-hvvf"
        />
      ),
      accessor: row => (
        <NotesCell
          row={row}
          hoveredRow={hoveredRow}
          handleActionModalOpen={handleActionModalOpen}
          data-testid="notescell-oai6"
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
        data-testid="taskactionmodal-26af"
      />
      {selectedRows.length > 0 && canDoAction && (
        <div>
          <StyledDivider data-testid="styleddivider-jsk1" />
          <ActionsRow
            rows={selectedRows}
            handleActionModalOpen={handleActionModalOpen}
            data-testid="actionsrow-92uw"
          />
        </div>
      )}
      <ScrollableTableWrapper data-testid="scrollabletablewrapper-t4sk">
        <StyledTable
          endpoint={`encounter/${encounterId}/tasks`}
          columns={[...(canDoAction ? [selectableColumn] : []), ...COLUMNS]}
          noDataMessage={<NoDataMessage data-testid="nodatamessage-cyqv" />}
          allowExport={false}
          onMouseEnterRow={handleMouseEnterRow}
          onMouseLeaveRow={handleMouseLeaveRow}
          hideHeader={data.length === 0}
          fetchOptions={searchParameters}
          onDataFetched={onDataFetched}
          refreshCount={refreshCount}
          defaultRowsPerPage={25}
          disableHoverEffect={!canDoAction}
          $canDoAction={canDoAction}
          data-testid="styledtable-3pst"
        />
      </ScrollableTableWrapper>
    </div>
  );
};
