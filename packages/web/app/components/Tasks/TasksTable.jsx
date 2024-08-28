import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import {
  BodyText,
  SmallBodyText,
  Table,
  formatShortest,
  formatTime,
  TranslatedText,
  useSelectableColumn,
  DataFetchingTable,
} from '../.';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';

const StyledTable = styled(DataFetchingTable)`
  margin-top: 6px;
  box-shadow: none;
  border-left: none;
  border-right: none;
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
    &:first-child,
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
  tr:last-child {
    td {
      border-bottom: 0px solid #fff;
    }
  }
  td {
    &:last-child {
      max-width: 200px;
      white-space: nowrap;
    }
  }
`;

const StatusTodo = styled.div`
  width: 15px;
  height: 15px;
  border: 1px dashed ${Colors.blue};
  border-radius: 50%;
`;

const BulkActions = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 5px;
  padding-right: 10px;
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
  font-size: 20px;
  color: ${Colors.primary};
`;

const StyledCancelIcon = styled(CancelIcon)`
  font-size: 20px;
  color: ${Colors.alert};
`;

const StyledCheckCircleIcon = styled(CheckCircleIcon)`
  font-size: 20px;
  color: ${Colors.green};
`;

const NoDataContainer = styled.div`
  height: 354px;
  font-weight: 500;
  margin: 20px 0 20px 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 148px;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

const getStatus = () => {
  return <StatusTodo />;
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
  if (!designations?.length) return '';

  const designationNames = designations.map(assigned => assigned.referenceData.name);
  return (
    <ConditionalTooltip visible={isOverflowing} title={designationNames.join(', ')}>
      <OverflowedBox ref={ref}>{designationNames.join(', ')}</OverflowedBox>
    </ConditionalTooltip>
  );
};

const getFrequency = ({ frequencyValue, frequencyUnit }) => `${frequencyValue} ${frequencyUnit}`;

const NotesCell = ({ row, hoveredRow }) => {
  const [ref, isOverflowing] = useOverflow();

  return (
    <Box display="flex" alignItems="center">
      <NotesDisplay>
        <ConditionalTooltip visible={isOverflowing} title={row.note}>
          <OverflowedBox ref={ref}>{row.note}</OverflowedBox>
        </ConditionalTooltip>
      </NotesDisplay>
      {hoveredRow?.id === row?.id && (
        <BulkActions>
          <ThemedTooltip
            title={
              <TranslatedText stringId="encounter.tasks.action.tooltip.delete" fallback="Delete" />
            }
          >
            <IconButton>
              <StyledDeleteOutlineIcon />
            </IconButton>
          </ThemedTooltip>
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="encounter.tasks.action.tooltip.notCompleted"
                fallback="Mark as not complete"
              />
            }
          >
            <IconButton>
              <StyledCancelIcon />
            </IconButton>
          </ThemedTooltip>
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="encounter.tasks.action.tooltip.completed"
                fallback="Mark as complete"
              />
            }
          >
            <IconButton>
              <StyledCheckCircleIcon />
            </IconButton>
          </ThemedTooltip>
        </BulkActions>
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
      fallback="No upcoming tasks to display. Please click '+ New task' to add a task to this patient."
    />
  </NoDataContainer>
);

export const TasksTable = ({ encounterId, searchParameters }) => {
  const [hoveredRow, setHoveredRow] = useState();
  const [data, setData] = useState([]);

  const onDataFetched = ({ data }) => {
    setData(data);
  };

  const { selectedRows, selectableColumn } = useSelectableColumn(data, {
    bulkDeselectOnly: true,
  });

  const COLUMNS = [
    {
      accessor: getStatus,
      maxWidth: 15,
      sortable: false,
    },
    {
      key: 'task',
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
      accessor: row => <NotesCell row={row} hoveredRow={hoveredRow} />,
      sortable: false,
    },
  ];

  return (
    <div>
      {selectedRows.length > 0 && (
        <div>
          <Divider style={{ marginTop: '5px' }} />
          <BulkActions>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.notCompleted"
                  fallback="Mark as not complete"
                />
              }
            >
              <IconButton>
                <StyledCancelIcon />
              </IconButton>
            </ThemedTooltip>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.completed"
                  fallback="Mark as complete"
                />
              }
            >
              <IconButton>
                <StyledCheckCircleIcon />
              </IconButton>
            </ThemedTooltip>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.delete"
                  fallback="Delete"
                />
              }
            >
              <IconButton>
                <StyledDeleteOutlineIcon />
              </IconButton>
            </ThemedTooltip>
          </BulkActions>
        </div>
      )}
      <StyledTable
        endpoint={`encounter/${encounterId}/tasks`}
        columns={[selectableColumn, ...COLUMNS]}
        noDataMessage={<NoDataMessage />}
        allowExport={false}
        onMouseEnterRow={(_, data) => setHoveredRow(data)}
        onMouseLeaveRow={() => setHoveredRow(null)}
        hideHeader={data.length === 0}
        searchParameters={searchParameters}
        onDataFetched={onDataFetched}
      />
    </div>
  );
};
